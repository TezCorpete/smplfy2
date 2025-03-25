// TODO: Make a one-time-use function to lemmatize the phrases
// and make lists of identifying words/phrases. Then, calculate
// any connections between them.

define(["lemmatizer", "json!src/phrases.json"], 
function(lem,          phraseData) {
  // **************************************************
  // Setup
  // **************************************************
  
  // Initialize the lemmatizer
  const lemmatizer = new lem.Lemmatizer();

  // json.js plugin automatically parses, so no parsing needed
  
  // **************************************************
  // Internal/Private (Not included in return statement)
  // **************************************************
  
  // For my sanity, I have wrapped the ".splice()" method of removing
  // a specific element in an Array in a function that doesn't look hacky
  Array.prototype.remove = function(index) {
    this.splice(index, 1); // Remove 1 element from the arry, starting at index
  }
  
  /*
   * Check if a string is an acronym
   * Explanation:
   *   From the start of the string to the end, ("^" to "$")
   *   check if there are at least 2 ("{2,}")
   *   valid acronym characters / non-lowercase letters. ("[A-Z&]")
   */
  String.prototype.isAcronym = function() {
    return this.test(/^[A-Z&]{2,}$/);
  }
  
  /**
   * Removes all acronyms from an Array of words
   * @param {Array} arr - A list potentially containing acronyms
   * @return {void} - All changes to arr are automatically applied
   * Didn't need to be an extension, just looks better this way
   */
  function removeAcronyms(arr) {
    let length = arr.length;
    let i = 0;
    while (i < length) {
      if (arr[i].isAcronym()) {
        arr.remove(i);
        // Element i has been removed, so the next element also has index i
      } else { // Not an acronym
        i++;
      }
      length = arr.length;
    } // End of loop
  } // End of removeAcronyms
  
  // **************************************************
  // Public
  // **************************************************
  
  return {
    /**
     * Normalizes the given fragment by removing any features that are potentially ever-so-slightly different
     * @param {String} line - A string that may contain some punctuation, which is to be ignored
     * @return {String} - The original line, sans acronyms, punctuation, capitalization, and alternate word forms
     */
    pickyNormalize: function(line) {
      // Replace all punctuation with spaces
      line = line.replaceAll(/[,.()\/]/, " ");
      
      // Make an array of all the words, without surrounding spaces
      const words = line.split(/[\s]+/);
      
      words.removeAcronyms();

      // Remove capitalization for all words
      const capNormalized = words.map((word) => word.toLowerCase()); // Arrow notation for the win!

      // Get one lemma for each word (Only ever choosing the first word should be fine, right?)
      const normalized = words.map((word) => lemmatizer.only_lemmas(word)[0]); // ".only_lemmas" returns a list

      // Return the line, a string once more
      return normalized.join(" ");
    }

    /** TODO: Move to private. Only used for setup of lookup.json
     * Generates the normalized list of phrase data, printing it to the console to be copied.
     */
    printNormalizedPhraseData: function() {
      // Start the list
      const data = [];

      // Run for all phrases
      for (int i = 0; i < phraseData.length; i++) {
        // Get the current phrase, instantiate object
        const entry = phraseData[i];
        const lookupObj = {};

        // Lemmatize all info
        const lemms = [];
        lemms.push(pickyNormalize(entry.phrase));
        lemms.push(pickyNormalize(entry.meaning));
        // Only if category exists
        if (Object.hasOwn(entry, "category")) {
          lemms.push(pickyNormalize(entry.category));
        }
        lookupObj.lemmas = lemms;

        // Add acronyms, if applicable
        if (Object.hasOwn(entry, "acronyms")) {
          lookupObj.acronyms = entry.acronyms;
        }

        lookupObj.index = i;
        data.push(lookupObj);
      } // End of for

      console.log(JSON.stringify(data));
    } // End of pNPD
  } // End of return/public
}); // End of define
