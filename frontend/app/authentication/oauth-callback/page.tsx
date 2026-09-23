import { redirect } from "next/navigation";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";

export default async function OAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ inviteToken?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  // If no session or no invite token, redirect to home or intended destination
  if (!session?.user?.email || !params.inviteToken) {
    return redirect(params.redirect || "/");
  }

  try {
    const dbModels = await getDBModels();
    const { User, Organization, Invite } = dbModels;

    // Find and validate the invite
    const invite = await Invite.findByToken(params.inviteToken);

    if (!invite || invite.isExpired()) {
      return redirect(params.redirect || "/");
    }

    // Verify email matches invite
    if (invite.email !== session.user.email) {
      return redirect(params.redirect || "/");
    }

    // Get the user
    const user = await User.findByEmail(session.user.email);
    if (!user) {
      return redirect(params.redirect || "/");
    }

    // Get the organization from the invite
    const organization = await invite.getOrganization();

    // Check if user is already in the organization
    const userOrganizations = await user.getOrganizations({
      where: { id: organization.id },
    });

    if (userOrganizations.length === 0) {
      // Add user to organization with the invited role
      await Organization.addUserToOrganization(organization, user, invite.role);
    }

    // Mark invite as used
    await invite.markAsUsed();

    // Redirect to the organization's apps page
    return redirect(`/${organization.slug}`);
  } catch (error) {
    console.error("Error processing invite:", error);
    return redirect(params.redirect || "/");
  }
}
