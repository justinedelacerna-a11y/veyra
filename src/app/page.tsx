import type { Metadata } from "next"
import { CustomerShell } from "@/components/shell/customer"
import { PageContainer, Section } from "@/components/layout"
import {
  HeroSection,
  TrustReassurance,
  HowItWorks,
  PopularCategories,
  WhyChooseVeyra,
  LocationsSection,
  FinalCta,
} from "@/features/home"
import { FeaturedVehicles } from "@/features/vehicles/components/featured-vehicles"

export const metadata: Metadata = {
  title: "Veyra — Premium Car Rental & Guaranteed Fleet Mobility",
  description:
    "Find and book the exact car for your journey. Luxury SUVs, executive sedans, and high-performance electric vehicles with contactless airport valet pickup and transparent pricing.",
}

export default function HomePage() {
  return (
    <CustomerShell>
      {/* 1. Hero & Rental Search Widget (Prominent placement above fold) */}
      <PageContainer>
        <HeroSection />
      </PageContainer>

      {/* 2. Trust & Reassurance Pillars */}
      <Section spacing="sm">
        <PageContainer>
          <TrustReassurance />
        </PageContainer>
      </Section>

      {/* 3. Featured Fleet Selection */}
      <Section spacing="lg" className="border-t bg-muted/10">
        <PageContainer>
          <FeaturedVehicles />
        </PageContainer>
      </Section>

      {/* 4. How Veyra Works (3-Step Flow) */}
      <Section spacing="lg" className="border-t">
        <PageContainer>
          <HowItWorks />
        </PageContainer>
      </Section>

      {/* 5. Popular Vehicle Categories */}
      <Section spacing="lg" className="border-t bg-muted/10">
        <PageContainer>
          <PopularCategories />
        </PageContainer>
      </Section>

      {/* 6. Why Choose Veyra (Product Standards) */}
      <Section spacing="lg" className="border-t">
        <PageContainer>
          <WhyChooseVeyra />
        </PageContainer>
      </Section>

      {/* 7. Available Hubs & Locations */}
      <Section spacing="lg" className="border-t bg-muted/10">
        <PageContainer>
          <LocationsSection />
        </PageContainer>
      </Section>

      {/* 8. Final Call to Action */}
      <Section spacing="xl" className="border-t">
        <PageContainer>
          <FinalCta />
        </PageContainer>
      </Section>
    </CustomerShell>
  )
}
