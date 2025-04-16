
import { IStep } from 'client-types/*';
import {
  SelectionContext,
  CreatorMessage,
} from "types";

const promptInstructions = `You are a helpful tool that works on text additions or replacements in an editor. You do help the user edit the text, but you answer in a structured way. Depending on the user's request, you can mark (using square brackets) your text in exactly one of the following ways:
[replace]...[/replace]: Your created text should replace the text the user sent
[above] ...[/above]: Your created text section should be placed above the currently selected section
[below]...[/below]: Your created text should be placed below the currently selected section
Make sure only one text command, [replace] / [above] / [below] is  used!

In addition, you also must add a short user feedback in [feedback]...[/feedback] tags.`;

const promptInstructions2 = `You are a helpful tool that works on text additions or replacements in an editor. You do help the user edit the text, but you answer in a structured way. Depending on the user's request, you can mark (using square brackets) your text in exactly one of the following ways:
[replace]...[/replace]: Your created text should replace the text the user sent
[above] ...[/above]: Your created text section should be placed above the currently selected section
[below]...[/below]: Your created text should be placed below the currently selected section

In addition, you also must add a short user feedback in [feedback]...[/feedback] tags.`;

export const messageBuilder = (context: SelectionContext, message: IStep, mdContent: string) => {
  let newMessage = message.output;
  let additional = {
    metadata: {
      full_text: mdContent,
    },
  };
  if (context) {
    if (context.selectionType === 'range' || context.selectionType === 'node') {
    /*newMessage = 
`
full text:
${mdContent}

selection:
${context?.markdown}

use markdown formatting. dont use latex. your answer should only include the new text.
only rewrite selection with following instructions:

${message.output}
`*/
    /*newMessage = 
`${promptInstructions2}

full text:
${mdContent}

selection:
${context?.markdown}

task:
${message.output}`;*/
  newMessage = 
`
${promptInstructions}


full text:
${mdContent}


selection:
${context?.markdown}


task:
${message.output}`;

additional = {
  metadata: {
    chat_mode: 'creator',
    full_text: mdContent,
    selection: context?.markdown
  },
}

    } else if (context.selectionType === 'document' || context.selectionType === 'caret') {
//     newMessage = 
// `
// full text:
// ${mdContent}

// use markdown formatting. dont use latex. your answer should only include the new text.
// rewrite full text with following instructions:

// ${message.output}
// `;
    newMessage = 
`
${promptInstructions}


full text:
${mdContent}


task:
${message.output}
`;

additional = {
  metadata: {
    chat_mode: 'creator',
    full_text: mdContent,
  },
}
    } else if (context.selectionType === 'codeblock') {
      if (context.selectedCode) {
      newMessage = `
${promptInstructions}


full code:
\`\`\`${context.language}
${context.code}
\`\`\`

selection:
\`\`\`${context.language}
${context.selectedCode}
\`\`\`


task:
${message.output}`;

additional = {
  metadata: {
    chat_mode: 'creator',
    full_text: context.code,
    selection: context.selectedCode
  },
}
      } else {
      newMessage = `
${promptInstructions}


full code:
\`\`\`${context.language}
${context.code}
\`\`\`


task:
${message.output}`;

additional = {
  metadata: {
    chat_mode: 'creator',
    full_text: context.code,
  },
}
      }
    }
  }
  
  return {
    ...message,
    // output: newMessage,
    ...additional
  }
}

export const messageParser = (message: string): CreatorMessage => {
  const belowRegex = /\[below\]((.|\n|\r)*)\[\/below\]/;
  const aboveRegex = /\[above\]((.|\n|\r)*)\[\/above\]/;
  const replaceRegex = /\[replace\]((.|\n|\r)*)\[\/replace\]/;
  const belowRegex2 = /\[below\]((.|\n|\r)*)\[feedback\]/;
  const aboveRegex2 = /\[above\]((.|\n|\r)*)\[feedback\]/;
  const replaceRegex2 = /\[replace\]((.|\n|\r)*)\[feedback\]/;
  const feedbackRegex = /\[feedback\]((.|\n|\r)*)\[\/feedback\]/;
  const hasClosingTag = /\[\/(below|above|replace)\]/.test(message);

  const belowMatch = message.match(hasClosingTag ? belowRegex : belowRegex2);
  const aboveMatch = message.match(hasClosingTag ? aboveRegex : aboveRegex2);
  const replaceMatch = message.match(hasClosingTag ? replaceRegex : replaceRegex2);
  const feedbackMatch = message.match(feedbackRegex);

  console.log(belowMatch);
  console.log(aboveMatch);
  console.log(replaceMatch);
  console.log(feedbackMatch);

  let insertType = 'none';
  let content = message;
  let feedback = null;

  if (belowMatch || aboveMatch || replaceMatch) {
    feedback = "Task done";
  }

  if (belowMatch) {
    insertType = 'after';
    content = belowMatch[1];
  } else if (aboveMatch) {
    insertType = 'before';
    content = aboveMatch[1];
  } else if (replaceMatch) {
    insertType = 'replace';
    content = replaceMatch[1];
  }

  if (feedbackMatch) {
    feedback = feedbackMatch[1];
  }

  return {
    insertType,
    content,
    feedback
  };
}