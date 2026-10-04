import AddRecordForm from '@/features/records/AddRecordForm'
import RecordActions from '@/features/records/RecordActions'

interface Props {
  onAdd: (url: string) => Promise<boolean>
  onBulk: () => void
  onUpdate: (period: 'month' | 'all') => void
  onZip: () => void
}

export default function AddRecordBar({ onAdd, ...actions }: Props) {
  return (
    <div className="my-6 flex flex-col gap-2">
      <AddRecordForm onAdd={onAdd} />
      <RecordActions {...actions} />
    </div>
  )
}
