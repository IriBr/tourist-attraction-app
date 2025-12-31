import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../utils/errors.js';
import {
  AuthProvider,
  AuthResponse,
  AuthTokens,
  User,
} from '@tourist-app/shared';
import type { JwtPayload } from '../middleware/auth.js';

// Google OAuth client
const googleClient = config.google.clientId
  ? new OAuth2Client(config.google.clientId)
  : null;

const SALT_ROUNDS = 12;

function mapUserToResponse(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider as AuthProvider,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function generateTokens(userId: string, email: string): AuthTokens {
  const accessToken = jwt.sign(
    { userId, email } as Omit<JwtPayload, 'iat' | 'exp'>,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = uuidv4();

  // Parse expiry time (e.g., "7d" -> 7 days in ms)
  const expiresInMs = parseExpiry(config.jwt.expiresIn);

  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(expiresInMs / 1000),
  };
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      authProvider: 'email',
    },
  });

  const tokens = generateTokens(user.id, user.email);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseExpiry(config.jwt.refreshExpiresIn)),
    },
  });

  return {
    user: mapUserToResponse(user),
    tokens,
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = generateTokens(user.id, user.email);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseExpiry(config.jwt.refreshExpiresIn)),
    },
  });

  return {
    user: mapUserToResponse(user),
    tokens,
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new UnauthorizedError('Refresh token expired');
  }

  // Delete old token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const tokens = generateTokens(storedToken.user.id, storedToken.user.email);

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: storedToken.user.id,
      expiresAt: new Date(Date.now() + parseExpiry(config.jwt.refreshExpiresIn)),
    },
  });

  return tokens;
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { userId, token: refreshToken },
    });
  } else {
    // Logout from all devices
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}

export async function getProfile(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User');
  }

  return mapUserToResponse(user);
}

export async function updateProfile(
  userId: string,
  data: { name?: string; avatarUrl?: string }
): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return mapUserToResponse(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.passwordHash) {
    throw new BadRequestError('Cannot change password for social login accounts');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal if email exists
  if (!user) return;

  // Delete any existing reset tokens
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  });

  // TODO: Send email with reset link
  // In production, integrate with email service
  console.log(`Password reset token for ${email}: ${token}`);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    throw new BadRequestError('Reset token has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    prisma.refreshToken.deleteMany({
      where: { user: { email: resetToken.email } },
    }),
  ]);
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  if (!googleClient) {
    throw new BadRequestError('Google login is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new UnauthorizedError('Invalid Google token');
  }

  const { email, name, picture, email_verified } = payload;

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // User exists - check if they used a different auth provider
    if (user.authProvider !== 'google' && user.authProvider !== 'email') {
      throw new ConflictError('Account exists with different login method');
    }
    // Update Google info if needed
    if (user.authProvider === 'email') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: 'google',
          avatarUrl: picture || user.avatarUrl,
          emailVerified: email_verified || user.emailVerified,
        },
      });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        avatarUrl: picture,
        authProvider: 'google',
        emailVerified: email_verified || false,
      },
    });
  }

  const tokens = generateTokens(user.id, user.email);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseExpiry(config.jwt.refreshExpiresIn)),
    },
  });

  return {
    user: mapUserToResponse(user),
    tokens,
  };
}

export async function appleLogin(
  idToken: string,
  userData?: { name?: string; email?: string }
): Promise<AuthResponse> {
  // Decode Apple ID token (JWT)
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded.payload === 'string') {
    throw new UnauthorizedError('Invalid Apple token');
  }

  const payload = decoded.payload as {
    sub: string;
    email?: string;
    email_verified?: boolean | string;
    iss: string;
    aud: string;
  };

  // Verify issuer and audience
  if (payload.iss !== 'https://appleid.apple.com') {
    throw new UnauthorizedError('Invalid Apple token issuer');
  }

  if (payload.aud !== config.apple?.clientId) {
    throw new UnauthorizedError('Invalid Apple token audience');
  }

  const appleUserId = payload.sub;
  const email = payload.email || userData?.email;

  if (!email) {
    throw new BadRequestError('Email is required for Apple login');
  }

  // Check if user exists by Apple ID or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { appleUserId },
        { email },
      ],
    },
  });

  if (user) {
    // Update Apple user ID if not set
    if (!user.appleUserId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          appleUserId,
          authProvider: 'apple',
          emailVerified: true,
        },
      });
    }
  } else {
    // Create new user
    const name = userData?.name || email.split('@')[0];
    user = await prisma.user.create({
      data: {
        email,
        name,
        authProvider: 'apple',
        appleUserId,
        emailVerified: true,
      },
    });
  }

  const tokens = generateTokens(user.id, user.email);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + parseExpiry(config.jwt.refreshExpiresIn)),
    },
  });

  return {
    user: mapUserToResponse(user),
    tokens,
  };
}
