import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const PATCH = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization } = dbModels;

  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  try {
    const organizationWithRole =
      await Organization.findBySlugAndUserEmailWithRole(
        organizationSlug,
        email
      );

    if (!organizationWithRole) return notAuthorized();
    const { organization, userRole } = organizationWithRole;

    // Only owners and admins can view user management
    if (userRole !== "owner" && userRole !== "admin") {
      return notAuthorized();
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const domain = formData.get("domain") as string;
    const imageFile = formData.get("profileImage") as File | null;

    if (!name || !slug || !domain) {
      return NextResponse.json(
        { message: "Name, slug, and domain are required" },
        { status: 400 }
      );
    }

    if (imageFile && imageFile.size > 0) {
      return NextResponse.json(
        { message: "Organization image upload is not supported" },
        { status: 400 }
      );
    }

    const result = await Organization.updateOrganizationDetails(
      organization,
      name,
      slug,
      domain
    );

    if (!result.success) {
      return NextResponse.json(
        {
          message: result.error,
          suggestedSlug: result.suggestedSlug,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Organization updated successfully",
      organization: {
        slug: result.organization?.slug,
        name: result.organization?.name,
        profileImageURL: result.organization?.profileImageURL,
      },
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to update organization" },
      { status: 500 }
    );
  }
};
