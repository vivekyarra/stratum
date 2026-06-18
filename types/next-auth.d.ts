import "next-auth";

declare module "next-auth" {
  interface Session {
    plan_type?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan_type?: string;
  }
}
