export default grammar({
  name: "kura",
  rules: {
    source_file: ($) => repeat($._definition),
    _definition: ($) => choice($.function_definition),

    function_definition: ($) => seq("fn", $.identifier, "(", ")", $.block),

    block: ($) => seq("{", repeat($._definition), "}"),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
