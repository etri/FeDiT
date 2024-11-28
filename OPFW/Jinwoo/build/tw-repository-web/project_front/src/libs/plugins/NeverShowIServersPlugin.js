const NeverShowServersPlugin = function(system) {
    return {
        components: {
            servers: () => null
        }
    }
}

export default NeverShowServersPlugin;