import { db } from "../server/db";
import { modes, categories } from "../shared/schema";

async function initializeData() {
  console.log("Initializing default data...");

  const defaultModes = [
    {
      name: "Eliminator",
      description:
        "Played in groupings of 12, with bottom 3 eliminated ¼ of the way through each competing window (i.e. 3 months for a year-long competition)",
    },
    {
      name: "Classic",
      description:
        "An app-wide competition for all competitors where only the top placers will win at the end of the period",
    },
  ];

  const defaultCategories = [
    {
      name: "Stocks & Profit (S&P500)",
      description: "S&P500 Fortune 500 companies",
      rules:
        "Users select or search from a listing of Fortune 500 companies and pick up to 10 stocks, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing stocks in the most correct order.",
      maxInvestments: 10,
    },
    {
      name: "Silicon Valley Savvy (Tech Stocks - NASDAQ)",
      description: "Top tech companies from NASDAQ",
      rules:
        "Users select or search from a listing of top tech companies and pick up to 10 stocks, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing stocks in the most correct order.",
      maxInvestments: 10,
    },
    {
      name: "Rags to Riches (Pennystocks – Russell 2000)",
      description: "Small cap stocks from Russell 2000",
      rules:
        "Users select or search from a listing of small cap stocks and pick up to 10 stocks, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing stocks in the most correct order.",
      maxInvestments: 10,
    },
    {
      name: "Blockchain Bonanza (Crypto)",
      description: "Various cryptocurrencies",
      rules:
        "Users select or search from a listing of various cryptocurrencies and pick up to 10 coins, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing coins in the most correct order.",
      maxInvestments: 10,
    },
    {
      name: "The Name is Bond (Bonds)",
      description: "Fixed income securities",
      rules: "TBD.",
      maxInvestments: 10,
    },
    {
      name: "Put up or Call Out (Options)",
      description: "Options trading on Fortune 500 companies",
      rules:
        "Users select or search from a listing of Fortune 500 companies and pick up to 5 option plays, puts or calls. The top winners at the end of the quarter are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing options in the most correct order.",
      maxInvestments: 5,
    },
  ];

  try {
    for (const mode of defaultModes) {
      await db.insert(modes).values(mode).onConflictDoNothing();
    }
    console.log("Modes initialized");

    for (const category of defaultCategories) {
      await db.insert(categories).values(category).onConflictDoNothing();
    }
    console.log("Categories initialized");

    console.log("Default data initialization complete!");
  } catch (error) {
    console.error("Error initializing data:", error);
    process.exit(1);
  }

  process.exit(0);
}

initializeData();
