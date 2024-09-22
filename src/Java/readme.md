# ☕ Java's Jira Journey ☕

Welcome to the Java realm of the Metrics-from-JIRA project! Here, we harness the power of Java to extract valuable insights from Jira and seamlessly integrate them into your Google Sheets. ✨

### What it Does ✨

* Summons data from Jira using the mystical Jira REST Java Client.
* Transforms raw data into insightful metrics with the help of Java's powerful spells (classes and methods).
* Wields the Google Sheets API to gracefully update your spreadsheet.
* Banishes any pesky formatting issues (like strikethroughs) with a wave of the Java wand. 🧹

### Prerequisites 🛠️

* Java Development Kit (JDK): Make sure you have Java installed and set up on your machine. ☕
* Maven or Gradle: Choose your preferred build tool to manage project dependencies and compilation. 🛠️
* Google API Client Library for Java: Install this library to interact with Google Sheets. 📦
* Jira REST Java Client: Install this library to communicate with the Jira API. 📦
* Apache Commons Codec: This library is needed for Base64 encoding (for Jira authentication). 📦

### How to Embark on Your Quest 🗺️

1. Clone the repository:

   ```bash
   git clone https://your-repository-url.git
   ```

2. Navigate to the Java realm:

   ```bash
   cd Metrics-from-JIRA/java
   ```

3. Gather your magical artifacts:

   * Jira API credentials: Your Jira username and API token. 🤫
   * Google Sheets API credentials: Set up OAuth2 and obtain the necessary client ID and secret. 🗝️
   * Project IDs and Labels: Identify the Jira filters and labels you want to target. 🏷️
   * Spreadsheet URL: The URL of your Google Sheet. 🔗

4. Configure the incantations:

   * Open the `copying_from_JIRA.java` file (or your equivalent Java filename).
   * Replace the placeholders with your actual Jira and Google Sheets credentials, project IDs, labels, and spreadsheet URL. 📝

5. Build and run the spell:

   * Using Maven:
     ```bash
     mvn compile exec:java -Dexec.mainClass="com.yourcompany.YourMainClass" 
     ```

   * Using Gradle:
     ```bash
     gradle run
     ```

Behold the Magic! ✨

Once the spell is cast, your Google Sheet will be updated with the latest Jira metrics, beautifully formatted and ready for your perusal. 📊

### Disclaimer ⚠️

* Even Java wizards encounter challenges. If you face any issues, consult the documentation or seek help from the developer community. 📜
* Remember, this is just the beginning of your Java-powered Jira quest. Feel free to customize and enhance the code to suit your specific needs. 🪄
* Most importantly, have fun exploring the realm of Jira metrics and automation with the power of Java! 🎉

✨ Signed by the Guru of Qualitea aka Jessica 🧙🏽‍♀️ 

