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
  title: "Veyra — Local Car Rental in Butuan City, Agusan del Norte",
  description:
    "Affordable, locally focused car rental in Butuan City, Agusan del Norte, Philippines. Clean, economical hatchbacks, sedans, and MPVs starting at ₱1,300/day with prompt barangay handover and transparent pricing.",
}

export default function HomePage() {
  return (
    <CustomerShell>
      {/* 1. Hero & Rental Search Widget (Edge-to-Edge Cinematic Background) */}
      <HeroSection />

      {/* 2. Trust & Reassurance Pillars (Seamless Transition) */}
      <Section spacing="sm" className="relative -mt-6 sm:-mt-10 z-20">
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
