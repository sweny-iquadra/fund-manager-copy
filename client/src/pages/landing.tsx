import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Trophy,
  DollarSign,
  Star,
  ChartLine,
  Globe,
  Target,
} from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const stats = [
    { label: "Active Traders", value: "12,547", icon: Users },
    { label: "Prize Pools", value: "$2.8M", icon: DollarSign },
    { label: "Active Contests", value: "156", icon: Trophy },
    { label: "Total Payouts", value: "$847K", icon: TrendingUp },
  ];

  const features = [
    {
      icon: Globe,
      title: "Classic Contests",
      description: "App-wide competition",
      details: [
        "Compete against all users",
        "Large prize pools",
        "Structured competitions",
        "Quarterly championships",
      ],
      entryFee: "$25 - $500",
      prizePool: "$50K - $2M",
      duration: "1-12 weeks",
      color: "bg-blue-50 border-blue-200",
      iconColor: "bg-primary text-white",
      buttonColor: "bg-primary hover:bg-blue-800",
    },
    {
      icon: Users,
      title: "Eliminator Contests",
      description: "Small group eliminations",
      details: [
        "Small group battles",
        "Progressive eliminations",
        "Fast-paced rounds",
        "Higher win rates",
      ],
      entryFee: "$10 - $100",
      prizePool: "8-32 players",
      duration: "1-4 weeks",
      color: "bg-red-50 border-red-200",
      iconColor: "bg-destructive text-white",
      buttonColor: "bg-destructive hover:bg-red-600",
    },
  ];

  const investmentModes = [
    {
      name: "S&P 500",
      description: "Large-cap stocks",
      icon: ChartLine,
      contests: 23,
      prizePool: "$127K",
      participants: 2847,
    },
    {
      name: "Tech Stocks",
      description: "Technology sector",
      icon: Target,
      contests: 18,
      prizePool: "$89K",
      participants: 1923,
    },
    {
      name: "Cryptocurrency",
      description: "Digital assets",
      icon: TrendingUp,
      contests: 31,
      prizePool: "$194K",
      participants: 3456,
    },
    {
      name: "Penny Stocks",
      description: "High-risk, high-reward",
      icon: DollarSign,
      contests: 12,
      prizePool: "$42K",
      participants: 876,
    },
    {
      name: "Bonds",
      description: "Fixed income securities",
      icon: Trophy,
      contests: 8,
      prizePool: "$28K",
      participants: 432,
    },
  ];

  const testimonials = [
    {
      name: "David Kim",
      role: "Tech Stocks Specialist",
      initials: "DK",
      color: "bg-blue-500",
      rating: 5,
      text: "I've won over $15,000 in the past year competing in Classic contests. The platform is intuitive and the competition is fierce!",
    },
    {
      name: "Lisa Rodriguez",
      role: "Crypto Trader",
      initials: "LR",
      color: "bg-purple-500",
      rating: 5,
      text: "The Eliminator contests are perfect for quick wins. I love the small group format and the higher probability of winning.",
    },
    {
      name: "James Chen",
      role: "S&P 500 Enthusiast",
      initials: "JC",
      color: "bg-green-500",
      rating: 5,
      text: "Great way to test trading strategies without risking real money. The educational value alone is worth it!",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <ChartLine className="h-8 w-8 text-primary mr-3" />
                <span className="text-xl font-bold text-primary">
                  FinanceFantasy
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="hidden md:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-blue-800">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative financial-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center animate-slide-up">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Compete. Trade. Win.
              <span className="block text-accent">$1,000,000</span>
              <span className="block text-2xl lg:text-4xl">
                Virtual Portfolio
              </span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Enter fantasy finance competitions with virtual portfolios.
              Compete against traders worldwide and win real prize money based
              on your returns.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-accent hover:bg-yellow-500 text-white font-semibold py-4 px-8 text-lg"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Join Competition
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white hover:bg-gray-200 hover:border-gray-200 hover:text-primary text-blue-500 font-semibold py-4 px-8 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative bg-white bg-opacity-10 backdrop-blur-sm border-t border-white border-opacity-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index} className="animate-fade-in">
                  <div className="text-2xl font-bold text-accent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contest Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Competition
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select from different contest formats designed for every type of
              trader
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`${feature.color} hover:shadow-lg transition-shadow`}
              >
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className={`${feature.iconColor} p-3 rounded-lg mr-4`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <div className="space-y-4 mb-8">
                    {feature.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{detail}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Entry Fee
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {feature.entryFee}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Prize Pool
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {feature.prizePool}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Duration
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {feature.duration}
                      </span>
                    </div>
                  </div>
                  <Button
                    className={`w-full ${feature.buttonColor} text-white font-semibold`}
                    asChild
                  >
                    <Link href="/login">Join {feature.title}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Modes */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Investment Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose your expertise area and compete in specialized markets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {investmentModes.map((mode, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 text-primary p-3 rounded-lg mr-4">
                      <mode.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {mode.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Active Contests
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {mode.contests}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Prize Pool
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {mode.prizePool}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Participants
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {mode.participants.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">View Contests</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start competing in just 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Choose Contest",
                description:
                  "Select from Classic or Eliminator contests in your preferred investment category",
              },
              {
                step: "2",
                title: "Allocate Portfolio",
                description:
                  "Distribute your $1M virtual portfolio across up to 10 investments",
              },
              {
                step: "3",
                title: "Track Performance",
                description:
                  "Monitor your rankings and returns in real-time leaderboards",
              },
              {
                step: "4",
                title: "Win Prizes",
                description:
                  "Earn real money based on your final ranking and performance",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Traders Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of successful traders competing on our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-gray-700 mb-6">
                    "{testimonial.text}"
                  </blockquote>
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 ${testimonial.color} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}
                    >
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 financial-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders competing for real prizes with virtual
            portfolios
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-accent hover:bg-yellow-500 text-white font-semibold py-4 px-8 text-lg"
              asChild
            >
              <Link href="/login">
                <Trophy className="mr-2 h-5 w-5" />
                Start Competing Now
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-white hover:bg-gray-200 hover:border-gray-200 hover:text-primary text-blue-500 font-semibold py-4 px-8 text-lg"
            >
              Learn More
            </Button>
          </div>
          <div className="mt-8 text-sm text-blue-100">
            <p>No credit card required • Free to start • Real prizes</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <ChartLine className="h-8 w-8 text-primary mr-3" />
                <span className="text-xl font-bold">FinanceFantasy</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The premier platform for competitive fantasy finance trading.
                Compete with virtual portfolios and win real prizes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contest Types
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Investment Modes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Leaderboards
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FinanceFantasy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
