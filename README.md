# Introduction 
This is a custom Microsoft PowerBI visual.
Consists of two custom slicer visuals. One is a normal slider that filters by a specific value, used to show threat estimations of a single month in the Threat Radar. The other slicer is also a slicer, but this one has 2 handles and filters between two values. The values are of string type, but can be used with dates as long as it has year before month before day etc.

# Getting Started
1. Make sure you have Git and Node.js installed
2. run `npm i -g powerbi-visuals-tools@latest` to install power bi packages gloablly if you have not already
3. Clone repo
4. run `npm install`
5. navigate to the correct folder "improvedDashboardSlicerSingle" for single slicer or "improvedDashboardSlicer" for the double slider using your command line
6. run `pbiviz start` to start a local developing server
7. in a online Power BI service report insert a Developer Visual to connect to the server
8. Press Refresh or Play symbol and see the result

# How to use single date slicer in PowerBI
1. Insert in the `Year-Month` field a formated date which is formated to the `yyyy-mm` format. This is for the internal filtering code
2. insert in the `Date` field dates which you wish to filter by

# How to use double date slicer in PowerBI
1. Insert in the `Min Date` field the earliest date in the dataset, which is formated to the `yyyy-mm` format.
2. Insert in the `year-month` field the latest date in the dataset, which is formated to the `yyyy-mm` format.
3. insert in the `Filter Column` field dates which is formated to the `yyyy-mm` format.

**Troubleshooting:** If you get the error "Can't contact visual server", the browser might be blocking the connection. To fix that go to https://localhost:8080/assets and allow the insecure connection.

For more information about custom visuals in Power BI:
https://www.microsoft.com/en-us/power-platform/products/power-bi/developers/custom-visualization 
