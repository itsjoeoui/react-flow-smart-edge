import {
	createGrid,
	getBoundingBoxes,
	gridToGraphPoint,
	pathfindingAStarDiagonal,
	svgDrawSmoothLinePath
} from '../functions'
import type {
	PointInfo,
	PathFindingFunction,
	SVGDrawFunction
} from '../functions'
import type { Node, EdgeProps } from 'react-flow-renderer'

type EdgeParams = Pick<
	EdgeProps,
	| 'sourceX'
	| 'sourceY'
	| 'targetX'
	| 'targetY'
	| 'sourcePosition'
	| 'targetPosition'
>

export type GetSmartEdgeOptions = {
	gridRatio?: number
	nodePadding?: number
	drawEdge?: SVGDrawFunction
	generatePath?: PathFindingFunction
}

export type GetSmartEdgeParams<NodeDataType = unknown> = EdgeParams & {
	options?: GetSmartEdgeOptions
	nodes: Node<NodeDataType>[]
}

export const getSmartEdge = <NodeDataType = unknown>({
	options = {},
	nodes,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition
}: GetSmartEdgeParams<NodeDataType>) => {
	const {
		gridRatio = 10,
		nodePadding = 10,
		drawEdge = svgDrawSmoothLinePath,
		generatePath = pathfindingAStarDiagonal
	} = options

	const roundCoordinatesTo = gridRatio

	// We use the node's information to generate bounding boxes for them
	// and the graph
	const { graphBox, nodeBoxes } = getBoundingBoxes<NodeDataType>(
		nodes,
		nodePadding,
		roundCoordinatesTo
	)

	const source: PointInfo = {
		x: sourceX,
		y: sourceY,
		position: sourcePosition
	}

	const target: PointInfo = {
		x: targetX,
		y: targetY,
		position: targetPosition
	}

	// With this information, we can create a 2D grid representation of
	// our graph, that tells us where in the graph there is a "free" space or not
	const { grid, start, end } = createGrid(
		graphBox,
		nodeBoxes,
		source,
		target,
		gridRatio
	)

	// We then can use the grid representation to do pathfinding
	const { fullPath, smoothedPath } = generatePath(grid, start, end)

	// Here we convert the grid path to a sequence of graph coordinates.
	const graphPath = smoothedPath.map((gridPoint) => {
		const [x, y] = gridPoint
		const graphPoint = gridToGraphPoint(
			{ x, y },
			graphBox.xMin,
			graphBox.yMin,
			gridRatio
		)
		return [graphPoint.x, graphPoint.y]
	})

	// Finally, we can use the graph path to draw the edge
	const svgPathString = drawEdge(source, target, graphPath)

	// The Label, if any, should be placed in the middle of the path
	const [middleX, middleY] = fullPath[Math.floor(fullPath.length / 2)]
	const { x: edgeCenterX, y: edgeCenterY } = gridToGraphPoint(
		{ x: middleX, y: middleY },
		graphBox.xMin,
		graphBox.yMin,
		gridRatio
	)

	return { svgPathString, edgeCenterX, edgeCenterY }
}
