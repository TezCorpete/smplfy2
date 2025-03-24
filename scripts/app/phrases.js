// TODO: Make a one-time-use function to lemmatize the phrases
// and make lists of identifying words/phrases. Then, calculate
// any connections between them.

define(["lemmatizer"], function(lem) {
  const lemmatizer = new lem.Lemmatizer();
  
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
   * @param {Array} wordList - A list potentially containing acronyms
   * @return {void} - All changes to wordList are automatically applied
   * Didn't need to be an extension, just looks better this way
   */
  Array.prototype.removeAcronyms = function() {
    let wlength = this.length;
    let i = 0;
    while (i < wlength) {
      if (this[i].isAcronym()) {
        this.remove(i);
        // Element i has been removed, so the next element also has index i
      } else { // Not an acronym
        i++;
      }
      wlength = this.length;
    } // End of loop
  } // End of removeAcronyms
  
  // **************************************************
  // Public
  // **************************************************
  
  return {
    /**
     * Mormalizes the given fragment by removing any features that are potentially ever-so-slightly different
     * @param {String} line - A string that may contain some non-words (acronyms, punctuation), which are to be ignored
     * @return {String} - The original line, sans acronyms, punctuation, and capitalization
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
  }
});

// TODO: Write a function that uses the lemmatizer on the given doc
// and searches phrases.json for matches.
