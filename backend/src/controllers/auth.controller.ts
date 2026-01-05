import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { VALIDATION } from '@tourist-app/shared';

const registerSchema = z.object({
  email: z.string().email().max(VALIDATION.EMAIL_MAX_LENGTH),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH)
    .max(VALIDATION.PASSWORD_MAX_LENGTH),
  name: z.string().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH)
    .max(VALIDATION.PASSWORD_MAX_LENGTH),
});

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH)
    .max(VALIDATION.NAME_MAX_LENGTH)
    .optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH)
    .max(VALIDATION.PASSWORD_MAX_LENGTH),
});

const googleLoginSchema = z.object({
  idToken: z.string(),
});

const appleLoginSchema = z.object({
  idToken: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data.email, data.password, data.name);
  sendCreated(res, result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data.email, data.password);
  sendSuccess(res, result);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const data = refreshTokenSchema.parse(req.body);
  const tokens = await authService.refreshTokens(data.refreshToken);
  sendSuccess(res, tokens);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  await authService.logout(req.user!.id, refreshToken);
  sendNoContent(res);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  sendSuccess(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.user!.id, data);
  sendSuccess(res, user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const data = changePasswordSchema.parse(req.body);
  await authService.changePassword(
    req.user!.id,
    data.currentPassword,
    data.newPassword
  );
  sendNoContent(res);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = forgotPasswordSchema.parse(req.body);
  await authService.requestPasswordReset(data.email);
  sendSuccess(res, { message: 'If the email exists, a reset link has been sent' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(data.token, data.password);
  sendSuccess(res, { message: 'Password reset successfully' });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const data = googleLoginSchema.parse(req.body);
  const result = await authService.googleLogin(data.idToken);
  sendSuccess(res, result);
});

export const appleLogin = asyncHandler(async (req: Request, res: Response) => {
  const data = appleLoginSchema.parse(req.body);
  const result = await authService.appleLogin(data.idToken, {
    name: data.name,
    email: data.email,
  });
  sendSuccess(res, result);
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const data = verifyEmailSchema.parse(req.body);
  const user = await authService.verifyEmail(data.token);
  sendSuccess(res, { message: 'Email verified successfully', user });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerificationEmail(req.user!.id);
  sendSuccess(res, { message: 'Verification email sent' });
});
