export class NewUser {
  email: string;
  password: string;
  nickname: string;

  constructor(email: string, password: string, nickname: string) {
    this.email = email;
    this.password = password;
    this.nickname = nickname;
  }

  changePassword(password: string) {
    this.password = password;
  }
}
