import { JsonEditor } from 'json-edit-react'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type {
    RecommendCombination,
    RecommendTwin,
} from '../types/ontologyTypes'

const OntologyRankComponent = ({
    title,
    item,
}: {
    title: string
    item: RecommendCombination[] | RecommendTwin[]
}) => {
    const [openSections, setOpenSections] = useState(true)

    const theme = {
        displayName: 'Default',
        fragments: { edit: 'rgb(42, 161, 152)' },
        styles: {
            container: {
                backgroundColor: '#ffffff',
                fontFamily: 'monospace',
            },
            collection: {},
            collectionInner: {},
            collectionElement: {},
            dropZone: {},
            property: '#292929',
            bracket: { color: 'rgb(0, 43, 54)', fontWeight: 'bold' },
            itemCount: { color: 'rgba(0, 0, 0, 0.3)', fontStyle: 'italic' },
            string: 'rgb(203, 75, 22)',
            number: 'rgb(38, 139, 210)',
            boolean: 'green',
            null: {
                color: 'rgb(220, 50, 47)',
                fontVariant: 'small-caps',
                fontWeight: 'bold',
            },
            input: ['#292929', { fontSize: '90%' }],
            inputHighlight: '#b3d8ff',
            error: { fontSize: '0.8em', color: 'red', fontWeight: 'bold' },
            iconCollection: 'rgb(0, 43, 54)',
            iconEdit: 'edit',
            iconDelete: 'rgb(203, 75, 22)',
            iconAdd: 'edit',
            iconCopy: 'rgb(38, 139, 210)',
            iconOk: 'green',
            iconCancel: 'rgb(203, 75, 22)',
        },
    }

    return (
        <div className="border rounded-lg px-4 w-full">
            <button
                onClick={() => setOpenSections((prev) => !prev)}
                className="w-full py-3 flex items-center hover:bg-gray-50 transition-colors"
            >
                {openSections ? <ChevronDown /> : <ChevronRight />}
                <span className="font-medium">{title}</span>
            </button>
            {openSections && (
                <>
                    {item.map((ontologyItem, idx) => (
                        <JsonEditor
                            key={`${title}-${idx}`}
                            data={ontologyItem}
                            restrictEdit
                            restrictAdd
                            restrictDelete
                            restrictDrag
                            enableClipboard={false}
                            showCollectionCount="when-closed"
                            rootName=""
                            theme={theme}
                            showArrayIndices={false}
                        />
                    ))}
                </>
            )}
        </div>
    )
}

export default OntologyRankComponent
