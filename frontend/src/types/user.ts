export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

export interface LoginResult {
  token: string;
  user: UserInfo;
}
