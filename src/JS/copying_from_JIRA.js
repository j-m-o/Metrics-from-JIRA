function fetchTickets() {
  var jiraDomain = '';
  var username = '';
  var apiToken = '';
  var generalFilterId = '';  // Replace with your general filter ID
  var techDebtFilterId = '';  // Replace with your tech debt filter ID
  var labels = [''];  // Replace with the labels you are looking for

 // Open the specific spreadsheet using its URL
  var spreadsheetUrl = 'Google sheet URL';
  var spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
  var originalSheet = spreadsheet.getSheetByName('SheetName');  // Replace with the actual name of the sheet to be copied

   if (!originalSheet) {
    throw new Error('Original sheet not found: SheetName');
  }
  
  // Copy the sheet
  var newSheet = originalSheet.copyTo(spreadsheet);
  var newSheetName = getFormattedDate(1);  // Get tomorrow's date as the sheet name
  newSheet.setName(newSheetName);

  // Move the new sheet before the original sheet
  var originalSheetIndex = spreadsheet.getSheets().indexOf(originalSheet);
  spreadsheet.setActiveSheet(newSheet);
  spreadsheet.moveActiveSheet(originalSheetIndex);

  // Clear the contents of the new sheet but preserve the header and formulas in column H
  var range = newSheet.getDataRange();
  var formulas = range.getFormulas();
  var notesFormulas = formulas.map(row => [row[7]]); // Copy formulas from column H
  
  // Clear all rows below the header row
  newSheet.getRange(2, 1, newSheet.getMaxRows()-1, newSheet.getMaxColumns()).clearContent();
  
  // Preserve formulas in column H
  newSheet.getRange(2, 8, notesFormulas.length, 1).setFormulas(notesFormulas); 
  
  // Remove strikethrough formatting from the entire sheet
  removeStrikethrough(newSheet);

  // Fetch tickets based on the general filter and labels
  fetchAndWriteTickets(newSheet, jiraDomain, username, apiToken, generalFilterId, labels, 150);

  // Fetch tech debt tickets based on the tech debt filter
  fetchAndWriteTechDebtTickets(newSheet, jiraDomain, username, apiToken, techDebtFilterId);
}

function fetchAndWriteTickets(sheet, jiraDomain, username, apiToken, filterId, labels, maxResults) {
  var labelCondition = labels.map(function(label) {
    return `labels = "${label}"`;
  }).join(' OR ');

  var jql = `
    filter = ${filterId} AND statusCategory != Done AND (${labelCondition}) AND
    (
      (sprint is EMPTY AND "Story Points[Number]" is EMPTY) OR
      (sprint is not EMPTY AND "Story Points[Number]" is not EMPTY AND created <= -60d)
    )
  `;
  var response = callJiraApi(jiraDomain, username, apiToken, jql, maxResults);

  if (response && response.issues) {
    var issues = response.issues;
    Logger.log(issues); // Log the response for debugging
    
    // Group issues by project key
    var issuesByProject = issues.reduce(function(result, issue) {
      var projectKey = issue.fields.project.key;
      if (!result[projectKey]) {
        result[projectKey] = [];
      }
      result[projectKey].push(issue);
      return result;
    }, {});

    var rows = [];
    var projectKeys = Object.keys(issuesByProject);
    for (var i = 0; i < projectKeys.length; i++) {
      var projectIssues = issuesByProject[projectKeys[i]];
      var projectRows = projectIssues.slice(0, 6).map(function(issue) {
        var createdDate = new Date(issue.fields.created);
        var formattedDate = Utilities.formatDate(createdDate, Session.getScriptTimeZone(), 'M/dd/yyyy HH:mm:ss');
        return [
          issue.key, 
          issue.fields.summary, 
          issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned',
          issue.fields.reporter ? issue.fields.reporter.displayName : 'Unknown',
          issue.fields.priority ? issue.fields.priority.name : 'N/A',
          issue.fields.customfield_10000 ? issue.fields.customfield_10000.value : 'N/A',  // Replace with your Product field ID if different
          formattedDate,
          ''  // Placeholder for Notes column with preserved formulas
        ];
      });
      rows = rows.concat(projectRows);
    }

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);  // Set values including the Notes column
    }
  }
}

function fetchAndWriteTechDebtTickets(sheet, jiraDomain, username, apiToken, filterId) {
  var jql = `
    filter = ${filterId} AND statusCategory != Done AND
    (
      (sprint is EMPTY AND "Story Points[Number]" is EMPTY) OR
      (sprint is not EMPTY AND "Story Points[Number]" is not EMPTY AND created <= -60d)
    )
    ORDER BY created DESC
  `;
  var response = callJiraApi(jiraDomain, username, apiToken, jql, 1);

  if (response && response.issues && response.issues.length > 0) {
    var issue = response.issues[0];
    var createdDate = new Date(issue.fields.created);
    var formattedDate = Utilities.formatDate(createdDate, Session.getScriptTimeZone(), 'M/dd/yyyy HH:mm:ss');
    sheet.appendRow([
      issue.key, 
      issue.fields.summary, 
      issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned',
      issue.fields.reporter ? issue.fields.reporter.displayName : 'Unknown',
      issue.fields.priority ? issue.fields.priority.name : 'N/A',
      issue.fields.customfield_10000 ? issue.fields.customfield_10000.value : 'N/A',  // Replace with your Product field ID if different
      formattedDate,
      ''  // Placeholder for Notes column with preserved formulas
    ]);
  }
}

function callJiraApi(jiraDomain, username, apiToken, jql, maxResults) {
  var url = `${jiraDomain}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`;
  var headers = {
    "Authorization": "Basic " + Utilities.base64Encode(username + ':' + apiToken),
    "Accept": "application/json"
  };

  var response = UrlFetchApp.fetch(url, {
    "method": "get",
    "headers": headers
  });

  return JSON.parse(response.getContentText());
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function getFormattedDate(daysToAdd) {
  var date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var day = date.getDate();
  var month = monthNames[date.getMonth()];
  var year = date.getFullYear();
  return month + '-' + day + '-' + year;
}

function applyConditionalFormatting(sourceSheet, targetSheet) {
  var rules = sourceSheet.getConditionalFormatRules();
  targetSheet.setConditionalFormatRules(rules);
}

function removeStrikethrough(sheet) {
  var range = sheet.getDataRange();
  var richTextValues = range.getRichTextValues();
  var newRichTextValues = [];

  for (var i = 0; i < richTextValues.length; i++) {
    var row = [];
    for (var j = 0; j < richTextValues[i].length; j++) {
      var cell = richTextValues[i][j];
      if (cell) {
        var newTextStyle = cell.getTextStyle().copy().setStrikethrough(false).build();
        var newCell = SpreadsheetApp.newRichTextValue()
          .setText(cell.getText())
          .setTextStyle(newTextStyle)
          .build();
        row.push(newCell);
      } else {
        row.push(cell);
      }
    }
    newRichTextValues.push(row);
  }
  range.setRichTextValues(newRichTextValues);
}