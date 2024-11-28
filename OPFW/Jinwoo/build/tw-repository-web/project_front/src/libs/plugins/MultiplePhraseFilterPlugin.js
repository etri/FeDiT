const MultiplePhraseFilterPlugin = function() {
    return {
        fn: {
            opsFilter: (taggedOps, phrase) => {
                const phrases = phrase.split(", ")

                return taggedOps.filter((val, key) => {
                    return phrases.includes(key)
                })
            }
        }
    }
}

export default MultiplePhraseFilterPlugin;