import DashboardIcon from '@mui/icons-material/GridViewRounded';
import MarketIcon from '@mui/icons-material/ShowChartRounded';
import TradeIcon from '@mui/icons-material/SwapHorizRounded';
import PortfolioIcon from '@mui/icons-material/PieChartRounded';
import WatchlistIcon from '@mui/icons-material/StarRounded';
import WalletIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import HistoryIcon from '@mui/icons-material/HistoryRounded';
import UsersIcon from '@mui/icons-material/PeopleAltRounded';

/**
 * Single source of truth for navigation. `group` drives the sidebar section
 * headings and `adminOnly` keeps privileged routes out of the user menu.
 */
export const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, group: 'Overview' },
  { label: 'Market', path: '/market', icon: MarketIcon, group: 'Trading' },
  { label: 'Trade', path: '/trade', icon: TradeIcon, group: 'Trading' },
  { label: 'Portfolio', path: '/portfolio', icon: PortfolioIcon, group: 'Trading' },
  { label: 'Watchlist', path: '/watchlist', icon: WatchlistIcon, group: 'Trading' },
  { label: 'Wallet', path: '/wallet', icon: WalletIcon, group: 'Account' },
  { label: 'History', path: '/history', icon: HistoryIcon, group: 'Account' },
  { label: 'Users', path: '/users', icon: UsersIcon, group: 'Administration', adminOnly: true },
];

export const groupOrder = ['Overview', 'Trading', 'Account', 'Administration'];

/** Route metadata used for breadcrumbs and document titles. */
export const routeMeta = {
  '/dashboard': { title: 'Dashboard', group: 'Overview' },
  '/market': { title: 'Market', group: 'Trading' },
  '/trade': { title: 'Trade', group: 'Trading' },
  '/portfolio': { title: 'Portfolio', group: 'Trading' },
  '/watchlist': { title: 'Watchlist', group: 'Trading' },
  '/wallet': { title: 'Wallet', group: 'Account' },
  '/history': { title: 'History', group: 'Account' },
  '/users': { title: 'Users', group: 'Administration' },
};

/** Groups the nav items the current user is allowed to see. */
export function buildNavGroups(isAdmin) {
  const visible = navigation.filter((item) => !item.adminOnly || isAdmin);
  return groupOrder
    .map((group) => ({ group, items: visible.filter((item) => item.group === group) }))
    .filter((section) => section.items.length > 0);
}

export default navigation;
