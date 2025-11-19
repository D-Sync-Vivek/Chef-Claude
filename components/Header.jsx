import chefClaude from "../src/assets/chef-claude-icon.png";

export default function Header() {
  return (
    <header className="header">
      <img className="header-image" src={chefClaude} alt="chef claude image" />
      <span className="header-name">Chef Claude</span>
    </header>
  );
}
