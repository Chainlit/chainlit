import { useState } from 'react';
import { Stack, Box, IconButton, Button, Menu, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';

const CreatorHeader = (): JSX.Element => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {
    closeCreatorOverlay,
  } = useEvoyaCreator();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseCreator = () => {
    closeCreatorOverlay();
  };

  const handleTestClick = (type: string) => {
    const message = {
      output: ''
    };
    switch(type) {
      case 'inline':
        message.output = 'Lorem ipsum **dolor** sit amet';
        break;
      case 'paragraph':
        message.output = '[replace]Lorem ipsum dolor sit amet, consectetur **adipiscing** elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.[/replace][feedback]new text inserted[/feedback]';
        break;
      case '2paragraph':
        message.output =
`[replace]Par1 Lorem ipsum dolor sit amet, consectetur **adipiscing** elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Par2 Lorem ipsum dolor sit amet, consectetur **adipiscing** elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.[/replace]
[feedback]new text inserted[/feedback]`;
        break;
      case 'paragraphWithTitle':
        message.output = '## My Title\nLorem ipsum dolor sit amet, consectetur **adipiscing** elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        break;
      case 'table':
        message.output = `| Discovery             | Description                                                                                                                                                                                                                           | Years           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Pythagorean Theorem   | In a right-angled triangle, the square of the length of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the lengths of the other two sides. This is expressed as $$a^2 + b^2 = c^2$$         | 6th century BC  |
| Pythagorean Triplets  | Sets of three positive integers (a, b, c) that satisfy the Pythagorean Theorem. For example, (3, 4, 5) and (5, 12, 13) are Pythagorean triplets.                                                                                      | 6th century BC  |
| Irrationality of √2   | Pythagoras discovered that the square root of 2 is an irrational number, meaning it cannot be expressed as a simple fraction. This was a significant discovery in the history of mathematics.                                         | 6th century BC  |
| Music and Mathematics | Pythagoras also made connections between music and mathematics, particularly in the study of harmonics and the relationships between musical notes. He is credited with the discovery of the mathematical basis of musical intervals. | 6th century BC  |
`;
      case 'extractContent':
        message.output =
`[below]In der Volkswirtschaftslehre wird die Wechselkursstabilität als entscheidend für den internationalen Handel angesehen.
Ein stabiler Wechselkurs fördert das Vertrauen der Investoren und erleichtert den Handel zwischen Ländern. Wenn die Schweizerische Nationalbank (SNB) jedoch gezwungen ist, Devisen zu kaufen, um den Franken zu schwächen, könnte dies als Währungsmanipulation interpretiert werden. Solche Maßnahmen könnten nicht nur zu einem Anstieg der Zölle führen, sondern auch die Wettbewerbsfähigkeit der Schweizer Exporte gefährden. Eine aggressive Geldpolitik könnte zudem zu Inflation führen, was die Kaufkraft der Verbraucher beeinträchtigen würde. Daher ist es für die SNB von größter Bedeutung, ein Gleichgewicht zwischen der Unterstützung der Wirtschaft und der Wahrung des internationalen Ansehens zu finden.[/below]

[feedback]Ein weiterer Absatz mit VWL-spezifischen Erklärungen wurde erfolgreich hinzugefügt![/feedback]`;

      case 'codesegment':
        message.output =
`[replace]
\`\`\`javascript
const server = http.createServer((req, res) => {
  // Set the response header
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  
  // Send the response body with HTML content
  res.end('<html><body><h1>Hello, World!</h1></body></html>\\n');
});
\`\`\`
[/replace]

[feedback]The server now sends HTML content as a response.[/feedback]`;
        break;
    }

    // @ts-expect-error is not a valid prop
    window.testCreatorUpdate(message);
    // setTimeout(() => window.testCreatorUpdate(message), 500);
    handleClose();
  };

  return (
    <Stack
      pl={2}
      pr={3}
      py={2}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      bgcolor="#fff"
      borderBottom="1px solid rgb(244, 244, 244)"
      className="header-bar"
    >
      <Stack direction="row" alignItems="center" spacing={2} fontWeight="bold">
        Creator
      </Stack>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box>
          <IconButton edge="end" id="close-creator-button" onClick={handleCloseCreator}>
            <CloseIcon sx={{ width: 20, height: 20 }} />
          </IconButton>
        </Box>
      </Stack>
    </Stack>
  );
};

export default CreatorHeader;
