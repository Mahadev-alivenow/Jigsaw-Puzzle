import CampaignsTab from "./CampaignsTab";
import TutorialTab from "./TutorialTab";
import CreateCampaignTab from "./CreateCampaignTab";
import SetupDiscountsTab from "./SetupDiscountsTab";

export default function TabsContent({ selectedTab }) {
  const renderTabContent = () => {
    switch (selectedTab) {
      case 1:
        return <CampaignsTab />;
      case 2:
        return <TutorialTab />;
      case 3:
        return <CreateCampaignTab />;
      case 4:
        return <SetupDiscountsTab />;
      default:
        return null;
    }
  };

  return <div>{renderTabContent()}</div>;
}
