import Hero from "../components/home/Hero";
import NewArrivals from "../components/home/NewArrivals";
import BrandStory from "../components/home/BrandStory";

/**
 * Home page — hero, new arrivals, brand story (footer in Layout).
 */
export default function HomePage() {
  return (
    <div className="home-page">
      <Hero />
      <NewArrivals />
      <BrandStory />
    </div>
  );
}
