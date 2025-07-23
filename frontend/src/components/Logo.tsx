import logo from 'assets/batlabs.png';
interface Props {
  className?: string;
}

export const Logo = ({ className }: Props) => {

  return (
    <img
      src={logo}
      alt="BatLabs"
    />
  );
};
