import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { AttractionCategory } from '../types';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Camera: { attractionName?: string } | undefined;
  Favorites: undefined;
  Profile: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeScreen: undefined;
  AttractionDetail: { id: string };
  CategoryList: { category: AttractionCategory };
  Reviews: { attractionId: string };
  WriteReview: { attractionId: string; reviewId?: string };
};

// Explore Stack
export type ExploreStackParamList = {
  ExploreScreen: undefined;
  Search: { query?: string };
  AttractionDetail: { id: string };
  CategoryList: { category: AttractionCategory };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  MyReviews: undefined;
  Settings: undefined;
  BadgesScreen: undefined;
  ProgressScreen: undefined;
  LeaderboardScreen: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
  About: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  EmailVerification: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Premium: undefined;
  AttractionDetail: { id: string };
};

// Screen Props Types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type ExploreStackScreenProps<T extends keyof ExploreStackParamList> =
  NativeStackScreenProps<ExploreStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

// Declare global types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
