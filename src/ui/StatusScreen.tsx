import type { ReactElement, ReactNode } from 'react'

type StatusScreenProps = {
  children: ReactNode
  role: 'status' | 'alert'
}

const StatusScreen = ({ children, role }: StatusScreenProps): ReactElement => (
  <div className="status-screen" role={role}>
    {children}
  </div>
)

export default StatusScreen
