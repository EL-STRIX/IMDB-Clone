import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/revalidate/actor/route";
import ActorPage, { generateMetadata } from "@/app/actor/[id]/page";
import * as cachedModule from "@/lib/api/cached";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/actor/789",
  notFound: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: any) => fn,
}));

describe("Actor Revalidation API Endpoint (/api/revalidate/actor)", () => {
  it("rejects unauthorized revalidation request with invalid secret", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate/actor?secret=wrong&id=123");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid secret");
  });

  it("rejects request missing actor id parameter", async () => {
    const req = new NextRequest("http://localhost:3000/api/revalidate/actor?secret=internship_revalidate_secret");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing 'id'");
  });

  it("successfully revalidates actor tag and path with valid secret", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/revalidate/actor?secret=internship_revalidate_secret&id=456"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.revalidated).toBe(true);
    expect(data.actorId).toBe("456");
  });
});

describe("Actor Profile Page (app/actor/[id]/page.tsx)", () => {
  const mockActor = {
    id: "789",
    name: "Leonardo DiCaprio",
    profileUrl: "https://image.tmdb.org/t/p/w500/leo.jpg",
    knownFor: "Acting",
    biography: "Leonardo Wilhelm DiCaprio is an acclaimed American actor.",
    birthday: "1974-11-11",
    placeOfBirth: "Los Angeles, California, USA",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(cachedModule, "getCachedPersonCredits").mockResolvedValue([]);
    vi.spyOn(cachedModule, "getCachedGenres").mockResolvedValue([]);
    vi.spyOn(cachedModule, "getCachedPersonExternalIds").mockResolvedValue({});
  });

  it("generates correct metadata for the actor profile", async () => {
    vi.spyOn(cachedModule, "getCachedPerson").mockResolvedValue(mockActor);

    const meta = await generateMetadata({ params: Promise.resolve({ id: "789" }) });
    expect(meta.title).toBe("Leonardo DiCaprio - IMDb Clone");
    expect(meta.description).toContain("Leonardo Wilhelm DiCaprio");
  });

  it("renders actor details, metadata chips and biography", async () => {
    vi.spyOn(cachedModule, "getCachedPerson").mockResolvedValue(mockActor);

    const PageJSX = await ActorPage({ params: Promise.resolve({ id: "789" }) });
    render(PageJSX);

    expect(screen.getByText("Leonardo DiCaprio")).toBeDefined();
    expect(screen.getByText("Acting")).toBeDefined();
    expect(screen.getByText("Born: 1974-11-11")).toBeDefined();
    expect(screen.getByText("Los Angeles, California, USA")).toBeDefined();
    expect(screen.getByText(/acclaimed American actor/i)).toBeDefined();
  });

  it("renders valid Person Schema.org JSON-LD structured data block", async () => {
    vi.spyOn(cachedModule, "getCachedPerson").mockResolvedValue({
      ...mockActor,
      alsoKnownAs: ["Leo", "Леонардо ДиКаприо"],
    });
    vi.spyOn(cachedModule, "getCachedPersonExternalIds").mockResolvedValue({
      imdbId: "nm0000138",
      instagramId: "leonardodicaprio",
      twitterId: "LeoDiCaprio",
    });

    const PageJSX = await ActorPage({ params: Promise.resolve({ id: "789" }) });
    const { container } = render(PageJSX);

    const jsonLdScript = container.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript).not.toBeNull();

    const parsedJsonLd = JSON.parse(jsonLdScript!.innerHTML);
    expect(parsedJsonLd["@context"]).toBe("https://schema.org");
    expect(parsedJsonLd["@type"]).toBe("Person");
    expect(parsedJsonLd.name).toBe("Leonardo DiCaprio");
    expect(parsedJsonLd.alternateName).toEqual(["Leo", "Леонардо ДиКаприо"]);
    expect(parsedJsonLd.birthDate).toBe("1974-11-11");
    expect(parsedJsonLd.jobTitle).toBe("Acting");
    expect(parsedJsonLd.sameAs).toContain("https://www.imdb.com/name/nm0000138");
    expect(parsedJsonLd.sameAs).toContain("https://instagram.com/leonardodicaprio");
  });

  it("renders translated UI labels and also_known_as alternate names in Spanish (locale=es)", async () => {
    vi.spyOn(cachedModule, "getCachedPerson").mockResolvedValue({
      ...mockActor,
      alsoKnownAs: ["Leo", "Леонардо ДиКаприо"],
    });

    const PageJSX = await ActorPage({
      params: Promise.resolve({ id: "789" }),
      searchParams: Promise.resolve({ locale: "es" }),
    });
    render(PageJSX);

    expect(screen.getByText(/Volver a la lista/i)).toBeDefined();
    expect(screen.getByText("Biografía")).toBeDefined();
    expect(screen.getByText("Nacimiento: 1974-11-11")).toBeDefined();
    expect(screen.getByText("También conocido como:")).toBeDefined();
    expect(screen.getByText("Леонардо ДиКаприо")).toBeDefined();
  });
});
