// 共享库存层:库存页 / 收货 / 发货 / 盘点 共同读写同一份数据
// crudMock 会拷贝种子数组,无法跨端点共享,故库存/流水改用本模块的实时数组

export interface Stock {
  id: number
  goodsId: number
  goodsName: string
  warehouseId: number
  warehouseName: string
  quantity: number
}

export interface Flow {
  id: number
  type: string // 入库 / 出库
  goodsName: string
  warehouseName: string
  quantity: number
  date: string
}

const warehouseNames: Record<number, string> = { 1: '主仓库', 2: '北方仓', 3: '南方仓' }

function today() {
  return new Date().toISOString().slice(0, 10)
}

// 初始库存:前 12 个商品 × 3 仓库,各 100
export const stocks: Stock[] = []
let sid = 1
for (let g = 1; g <= 12; g++) {
  for (let w = 1; w <= 3; w++) {
    stocks.push({ id: sid++, goodsId: g, goodsName: `商品${g}`, warehouseId: w, warehouseName: warehouseNames[w], quantity: 100 })
  }
}

// 初始流水:给演示页一些初始数据
export const flows: Flow[] = []
let fid = 1
for (let i = 0; i < 12; i++) {
  flows.push({
    id: fid++,
    type: i % 2 === 0 ? '入库' : '出库',
    goodsName: `商品${(i % 12) + 1}`,
    warehouseName: warehouseNames[(i % 3) + 1],
    quantity: (i + 1) * 5,
    date: today(),
  })
}

export function getQty(goodsId: number, warehouseId: number): number {
  return stocks.find((s) => s.goodsId === goodsId && s.warehouseId === warehouseId)?.quantity ?? 0
}

export function addStock(goodsId: number, goodsName: string, warehouseId: number, warehouseName: string, qty: number) {
  const s = stocks.find((x) => x.goodsId === goodsId && x.warehouseId === warehouseId)
  if (s) s.quantity += qty
  else stocks.push({ id: sid++, goodsId, goodsName, warehouseId, warehouseName, quantity: qty })
  flows.unshift({ id: fid++, type: '入库', goodsName, warehouseName, quantity: qty, date: today() })
}

export function reduceStock(goodsId: number, goodsName: string, warehouseId: number, warehouseName: string, qty: number) {
  const s = stocks.find((x) => x.goodsId === goodsId && x.warehouseId === warehouseId)
  if (s) s.quantity -= qty
  flows.unshift({ id: fid++, type: '出库', goodsName, warehouseName, quantity: qty, date: today() })
}

export function setQty(goodsId: number, warehouseId: number, qty: number) {
  const s = stocks.find((x) => x.goodsId === goodsId && x.warehouseId === warehouseId)
  if (s) s.quantity = qty
}
