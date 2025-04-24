export class AppUser {
  id;
  email;
  emailVerified;
  name;
  photoURL;
  phoneNumber;

  constructor(user) {
    this.id = user.uid;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.name = user.displayName ?? null;
    this.photoURL = typeof user.photoURL === "string" ? user.photoURL : null;
    const provider = user.providerData[0];
    this.phoneNumber =
      typeof provider?.phoneNumber === "string" ? provider.phoneNumber : null;
  }
}