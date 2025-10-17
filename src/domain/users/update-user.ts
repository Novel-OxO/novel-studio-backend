export class UpdateUser {
  nickname?: string;
  profileImageUrl?: string | null;

  constructor(nickname?: string, profileImageUrl?: string | null) {
    this.nickname = nickname;
    this.profileImageUrl = profileImageUrl;
  }
}
