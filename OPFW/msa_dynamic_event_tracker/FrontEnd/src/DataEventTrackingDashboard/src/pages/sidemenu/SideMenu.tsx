import { Link } from 'react-router'
import { LayoutDashboard } from 'lucide-react'

export default function SideMenu() {
    return (
        <>
            <div className="w-64 h-full">
                <aside className="h-full" aria-label="Sidebar">
                    <div className="px-3 py-4 overflow-y-auto h-full bg-gray-50 dark:bg-gray-800">
                        <ul className="space-y-2">
                            <li className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                <LayoutDashboard className="w-6 h-6" />
                                <Link to="/data-tracking">
                                    <span className="flex-1 ml-3 whitespace-nowrap">
                                        Data Tracking
                                    </span>
                                </Link>
                            </li>
                            <li className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                <LayoutDashboard className="w-6 h-6" />
                                <Link to="/data-tracking-list">
                                    <span className="flex-1 ml-3 whitespace-nowrap">
                                        Data Tracking list
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </>
    )
}
