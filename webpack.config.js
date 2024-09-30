module.exports = {
    module: {
      rules: [
        {
          test: /pdf\.worker(\.min)?\.js$/,
          use: 'file-loader',
        },
      ],
    },
  };