export class User {
  id: string;
  email: string;
  password: string;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(
    id: string,
    email: string,
    password: string,
    nickname: string,
    profileImageUrl: string | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.nickname = nickname;
    this.profileImageUrl = profileImageUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }
}
