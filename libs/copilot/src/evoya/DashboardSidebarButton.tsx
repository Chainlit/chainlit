import { BsLayoutSidebar } from "react-icons/bs";

import { useMediaQuery } from "react-responsive";

import { Button } from '@chainlit/app/src/components/ui/button';

export default function DashboardSidebarButton() {
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1199px)' })
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-dashboard-sidebar'));
  };
  if (!isTabletOrMobile) return null;
  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
        <BsLayoutSidebar />
    </Button>
  );
}