import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In"
        description="Kaza Dashboard - Sign In"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
