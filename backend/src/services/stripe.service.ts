import Stripe from 'stripe';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';

// Initialize Stripe
const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : null;

export type SubscriptionPlan = 'monthly' | 'annual';

interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
}

interface SubscriptionStatus {
  isActive: boolean;
  plan: SubscriptionPlan | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

class StripeService {
  private ensureStripe(): Stripe {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
    }
    return stripe;
  }

  /**
   * Create or get a Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const stripe = this.ensureStripe();

    // Check if user already has a Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    // Save the customer ID to the user
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
    const stripe = this.ensureStripe();
    const { userId, email, plan, successUrl, cancelUrl } = params;

    const customerId = await this.getOrCreateCustomer(userId, email);

    const priceId = plan === 'monthly'
      ? config.stripe.monthlyPriceId
      : config.stripe.annualPriceId;

    if (!priceId) {
      throw new Error(`Price ID not configured for ${plan} plan`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    });

    return session.url || '';
  }

  /**
   * Create a billing portal session for managing subscription
   */
  async createBillingPortalSession(userId: string, returnUrl: string): Promise<string> {
    const stripe = this.ensureStripe();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found for this user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionEndDate: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return {
        isActive: false,
        plan: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const isActive = user.subscriptionTier === 'premium' &&
      user.subscriptionEndDate &&
      new Date(user.subscriptionEndDate) > new Date();

    // If we have a Stripe subscription, get detailed status
    if (user.stripeSubscriptionId && stripe) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const interval = subscription.items.data[0]?.price?.recurring?.interval;
        const periodEnd = (subscription as any).current_period_end;

        return {
          isActive: subscription.status === 'active' || subscription.status === 'trialing',
          plan: interval === 'year' ? 'annual' : 'monthly',
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        };
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    return {
      isActive: isActive ?? false,
      plan: isActive ? 'monthly' : null, // Default to monthly if we can't determine
      currentPeriodEnd: user.subscriptionEndDate,
      cancelAtPeriodEnd: false,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(body: string | Buffer, signature: string): Promise<void> {
    const stripe = this.ensureStripe();

    if (!config.stripe.webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret
    );

    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    console.log(`Checkout completed for user ${userId}`);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      // Try to find user by customer ID
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (!user) {
        console.error('Could not find user for subscription update');
        return;
      }
      await this.updateUserSubscription(user.id, subscription);
    } else {
      await this.updateUserSubscription(userId, subscription);
    }
  }

  private async updateUserSubscription(userId: string, subscription: Stripe.Subscription): Promise<void> {
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    const plan = interval === 'year' ? 'annual' : 'monthly';
    const periodEnd = (subscription as any).current_period_end;

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: isActive ? 'premium' : 'free',
        subscriptionEndDate: periodEnd ? new Date(periodEnd * 1000) : null,
        stripeSubscriptionId: subscription.id,
      },
    });

    console.log(`Updated subscription for user ${userId}: ${isActive ? 'premium' : 'free'} (${plan})`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'free',
          stripeSubscriptionId: null,
        },
      });

      console.log(`Subscription cancelled for user ${user.id}`);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment succeeded for invoice ${invoice.id}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment failed for invoice ${invoice.id}`);
    // You could send an email notification here
  }

  /**
   * Cancel a subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    const stripe = this.ensureStripe();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    console.log(`Subscription will cancel at period end for user ${userId}`);
  }

  /**
   * Resume a cancelled subscription
   */
  async resumeSubscription(userId: string): Promise<void> {
    const stripe = this.ensureStripe();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    console.log(`Subscription resumed for user ${userId}`);
  }
}

export const stripeService = new StripeService();
