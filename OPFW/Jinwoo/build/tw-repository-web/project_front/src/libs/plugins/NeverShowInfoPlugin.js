const NeverShowInfoPlugin = function(system) {
    return {
        components: {
            info: () => null
        }
    }
}

export default NeverShowInfoPlugin;