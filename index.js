   require("dotenv").config();
   const readline = require("readline");
   const readlineSync = require("readline-sync");
   const chalk = require("chalk");
   const { printName } = require("./utils/name");
   const { checkIn, faucetETH, faucetGOON, swapTokens, executeStake } = require("./src/main");
   const predict = require('./src/predict');
   const createToken = require("./src/createToken");

   function promptUser(question) {
     return new Promise(resolve => {
       const rl = readline.createInterface({
         input: process.stdin,
         output: process.stdout
       });
       rl.question(chalk.blueBright(question), answer => {
         rl.close();
         resolve(answer);
       });
     });
   }
 

   async function main() {
 
     printName();
     console.log(chalk.yellow("Available Scripts:"));
     console.log("1. CheckIn");
     console.log("2. Claim Faucet ETH");
     console.log("3. Claim Faucet GOON");
     console.log("4. Swap GOON/goonUSD");
     console.log("5. Stake goonUSD");
     console.log("6. Predict ETH/BTC/ARB Price");
     console.log("7. Create Asset Tokenized");
     console.log("0. Exit Program");

     const scriptChoice = await promptUser("\nChoose the script to run: ");
     
     switch(scriptChoice) {
       case '1':
         await checkIn();
         break;
       case '2':
         await faucetETH();
         break;
       case '3':
         await faucetGOON();
         break;
       case '4':
         await swapTokens();
         break;
       case '5':
         await executeStake();
         break;
       case '6':
         await predict();
         break;
       case '7':
         await createToken();
         break;
       case '0':
         console.log(chalk.green("Exiting program. Goodbye!"));
         process.exit(0);
       default:
         console.log(chalk.red("Invalid choice. Please restart and choose 1 - 7."));
     }
   }

   main().catch(console.error);