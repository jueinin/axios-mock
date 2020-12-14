module.exports = {
    presets: [
        ['@babel/preset-env',{
            modules: 'cjs',
            targets: {
                node: 'current'
            }
        }],
        ['@babel/preset-typescript',{
            allowNamespaces: true
        }]
    ],
    plugins: ["@babel/plugin-proposal-class-properties"]
}