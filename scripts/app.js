requirejs.config({
  //By default load any module IDs from js/lib
  baseUrl: "scripts/lib",
  // ../ is a shorthand for parent directory, used to override baseUrl
  paths: {
    app: "../app",
    src: "../src",
    lemmatizer: "lemmatizer-v0.0.2",
    underscore: "underscore-umd-min",
    jquery: "jquery-3.7.1.min",
    json: "require/json",
    text: "require/text"
  }
});

// Start the main app logic.
requirejs(["jquery", "app/phrases"],
function (  $,        phrases) {
  
  function addRow(event) {
    // Create the row
    const newRow = $("<div></div>").attr("class", "row");
    let entries = [];
    
    // If addRow was called by an entry
    if (event !== null && $(event.target).hasClass("entry")) {
      // Make the clicked entry the only one, and highlighted
      const entry = $(event.target);
      
      entry.css("outline", "2px solid green");
      entry.siblings().remove();

      // Remove all following rows if there are any
      if (entry.parent().nextAll().length !== 0) {
        // Slide each up then delete it
        entry.parent().nextAll().each( function() {
          $(this).empty(); // Removes all children from this & .data cache
          $(this).remove();
        }); // End .nextAll
      } // End row removal

      // Save each connection as a full lookup object
      entries = expandConnections( entry.data().lookup );
    } // End entry-call operations
    
    $("#canvas").append(newRow);
    
    for (let i = 0; i < entries.length; i++) {
      addEntry( entries[i] );
    }
  } // End addRow

  function expandConnections(entry) {
    if ( !Object.hasOwn(entry, "connections") ) {
      return;
    }

    const full = [];
    const connections = entry.connections;
    for (let i = 0; i < connections.length; i++) {
      const lookup = phrases.fetchLookup( connections[i].index );
      full.push(lookup);
    }

    return full;
  }
  
  function addEntry(lookupObj) {
    // Add a row if there aren't any already
    if ($(".row").length === 0) {
      addRow(null);
    }

    if ( notIncluded(lookupObj) ) {
      // Create the entry
      const newEntry = $("<div></div>").attr("class", "entry");
      const real = phrases.fetch( lookupObj.index );
      newEntry.text( real.phrase );
      newEntry.data( "lookup", lookupObj );
      $(".row").last().append(newEntry);
    } // End canvas check for entry
  } // End addEntry

  function notIncluded(lookupObj) {
    const realPhrase = phrases.fetch( lookupObj.index ).phrase;
    let included = false;

    $(".entry").each( function() {
      const thisPhrase = $(this).text();

      if ( realPhrase.valueOf() == thisPhrase.valueOf() ) {
        included = true;
        return; // Break out of .each loop
      }
    });
    
    return (!included);
  }
  
  function displayPhrase( phraseObj ) {
    $("#def-tbl").css("display", "grid");

    if ( Object.hasOwn(phraseObj, "category") ) {
      addCategory(phraseObj.category);

      $("#def-tbl-phrase").css("grid-row", "3 / span 1");
    } else {
      $("#def-tbl-cat").remove();

      $("#def-tbl-phrase").css("grid-row", "2 / span 2");
    }

    $("#def-tbl-phrase").text( phraseObj.phrase );

    $("#def-tbl-def").text( phraseObj.meaning );
  }

  function addCategory(cat) {
    const category = $("<div></div>").attr("id", "def-tbl-cat");
    category.text( cat );
    
    $("#def-tbl").append(category);
  }

  function annotateText(text) {
    if ( text.length === 0) {
      return;
    }
    
    // Disable the textarea
    $("#doc-text").attr("contenteditable", "false");

    // Returns a list of match objects. "locations" contains index/span
    // objects of the match, and "lookup" the lookup obj from lookup.json
    const matches = phrases.findMatches(text);
    
    const splitText = text.split(/[\s]+/g);

    // For every match
    for (let i = 0; i < matches.length(); i++) {
      const match = matches[i];
      
      // For every matched index/span
      for (let j = 0; j < match.locations.length; j++) {
        const index = match.locations[j].index;
        const span = match.locations[j].span;

        // Annotate all words in the span individually
        for (let k = index; k < index + span; k++) {
          splitText[k] = annotate(splitText[k], match.lookup);
        }
      } // End matchedIndices loop
    } // End match loop

    $("#doc-text").html( splitText.join(" ") );
  } // End annotateText
  
  function annotate(thing, lookupObj) {
    // If it has already been annotated, add another
    if ( typeof thing === "object" ) {
      thing.data().phrases.push(lookupObj);
      
      return thing;
    } else if ( typeof thing === "string" ) {
      const annotation = $("<span></span>").attr("class", "annotation");
      annotation.text( thing );
      // Initialize the list of phrases in data
      annotation.data().phrases = [];
      // Save the phrase object in said
      annotation.data().phrases.push(lookupObj);

      return annotation;
    }
  } // End annotate

  // When the document has loaded, add event listeners
  $(document).ready(function() {
    addEntry( phrases.mostLikely ); // For testing
    
    $("#canvas").on("click", ".entry", function( event ) {
      addRow( event );
      
      const entry = $(event.target);
      const index = entry.data().lookup.index;
      const phraseData = phrases.fetch( index );
      displayPhrase( phraseData );
    });

    $("#doc-text").on("click", ".annotation", function( event ) {
      // Out of utmost caution, I am emptying each row individually
      // before deleting it, to prevent data cache issues
      if ( $("#canvas").children().length !== 0 ) {
        $("#canvas").children().each( function() {
          $(this).empty(); // Removes all children from this & .data cache
          $(this).remove();
        }); // End .each
      } // End row removal
      $("#canvas").empty(); // I do NOT want to fix another memory issue
      
      // Add all the matches to canvas
      const spanEl = $(event.target);
      const matches = spanEl.data().phrases;
      for (let i = 0; i < matches.length; i++) {
        addEntry( matches[i] );
      }
    }); // End of #doc-text .annotation

    $("#input-btns").on("click", "#paste-btn", function() {
      if ( $("#canvas").attr("contenteditable") === "true" ) {
        console.log("Paste clicked!");

        navigator.clipboard
          .readText()  // Returns Promise
          .then(
            (txt) => { $("#doc-text").text(txt); }
          );
        
        return;
      }

      console.log("Can't edit right now!");
    }); // End of #input-btns #paste-btn

    $("#input-btns").on("click", "#submit-btn", function() {
      annotateText( $("#doc-text").val() );
    }); // End of #input-btns #paste-btn
  }); // End of document/ready
}); // End of main logic
