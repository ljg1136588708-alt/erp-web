# ERP-Web 接口契约

> 前端目前以 Mock 实现这些接口(`mock/` 目录),后端按本文档实现后,前端改 `.env` 的 `VITE_API_BASE_URL` 切真实地址即可,页面不动。

## 通用约定

- 基地址:`VITE_API_BASE_URL`(开发为 `/api`)。
- 统一响应包:`{ "code": 0, "message": "ok", "data": <T> }`,`code === 0` 为成功;非 0 时前端弹出 `message` 并按失败处理。
- 鉴权:登录后前端在请求头带 `Authorization: Bearer <token>`。HTTP 401 时前端清 token 并跳登录。
- 列表统一分页:请求 `?page=<页码>&pageSize=<每页>&keyword=<可选模糊词>`,响应 `data: { list: T[], total: number }`。

## 通用 CRUD(下列资源均遵循此 5 端点)

| 方法 | 路径 | 说明 | 请求 | 响应 data |
|---|---|---|---|---|
| GET | `/<resource>` | 分页列表 | query: page,pageSize,keyword | `{ list, total }` |
| POST | `/<resource>` | 新增 | body: 实体(无 id) | 新实体(含 id) |
| PUT | `/<resource>/:id` | 更新 | body: 变更字段 | null |
| DELETE | `/<resource>/:id` | 删除 | — | null |

**遵循通用 CRUD 的资源:**

| resource | 实体字段 |
|---|---|
| `/system/user` | id, username, nickname, status(0/1), roleName |
| `/system/role` | id, name, code, remark, permissions(string[]) |
| `/system/dept` | id, name, parentId(0 为顶级), sort |
| `/system/menu` | id, title, path, permission |
| `/scm/goods` | id, name, category, unit, spec, price |
| `/scm/supplier` | id, name, contact, phone |
| `/scm/customer` | id, name, contact, phone |
| `/scm/warehouse` | id, name, location |
| `/scm/purchase` | id, orderNo, supplierName, warehouseId, warehouseName, date, amount, status(待审核/已审核/已入库), items |
| `/scm/sale` | id, orderNo, customerName, warehouseId, warehouseName, date, amount, status(待审核/已审核/已出库), items |
| `/scm/inbound` | id, inboundNo, sourceOrderNo, warehouseName, amount, date |
| `/scm/outbound` | id, outboundNo, sourceOrderNo, warehouseName, amount, date |
| `/scm/check` | id, checkNo, warehouseId, warehouseName, status(进行中/已完成), date, items |

**订单明细 item**:`{ goodsId, goodsName, qty, price }`,`小计 = qty*price`,`订单 amount = Σ小计`。
**盘点明细 item**:`{ goodsId, goodsName, systemQty(账面), actualQty(实盘) }`,`差异 = actualQty - systemQty`。

## 鉴权与个人中心

| 方法 | 路径 | 说明 | 请求 | 响应 data |
|---|---|---|---|---|
| POST | `/login` | 登录 | `{ username, password }` | `{ token }`;失败 `code≠0` |
| GET | `/user/info` | 当前用户 | — | `{ id, username, nickname, roles, permissions(string[]), menus }` |
| POST | `/user/change-password` | 改密码 | `{ oldPassword, newPassword }` | null |

`menus` 项:`{ name, path, title, icon?, children? }`,前端据此动态生成路由与侧栏菜单;`permissions` 为按钮权限码(如 `user:add`),前端 `v-permission` 据此控制按钮显隐。

## 系统管理专用

| 方法 | 路径 | 说明 | 请求 | 响应 data |
|---|---|---|---|---|
| GET | `/system/permission/all` | 权限目录(分配权限用) | — | `[{ module, perms:[{code,title}] }]` |
| POST | `/system/user/:id/reset-password` | 重置密码(重置为默认) | — | null |

## 进销存专用(库存联动)

| 方法 | 路径 | 说明 | 请求 | 响应 |
|---|---|---|---|---|
| GET | `/scm/stock` | 库存查询(商品×仓库) | query: page,pageSize,keyword | `{ list:[{id,goodsId,goodsName,warehouseId,warehouseName,quantity}], total }` |
| GET | `/scm/flow` | 出入库流水(只读) | query: page,pageSize,keyword | `{ list:[{id,type(入库/出库),goodsName,warehouseName,quantity,date}], total }` |
| GET | `/scm/goods/options` | 商品下拉(订单明细用) | — | `[{ id, name, price, unit }]` |
| GET | `/scm/warehouse/options` | 仓库下拉 | — | `[{ id, name }]` |
| POST | `/scm/purchase/:id/receive` | 采购收货 | `{ warehouseId, warehouseName, items:[{goodsId,goodsName,qty}] }` | 逐明细**增加**库存并写入库流水;返回 null |
| POST | `/scm/sale/:id/ship` | 销售发货 | `{ warehouseId, warehouseName, items:[{goodsId,goodsName,qty}] }` | 先校验所有明细库存充足(**全或无**),不足返回 `code≠0,message`;充足则逐明细**扣减**库存并写出库流水 |
| POST | `/scm/check/:id/finish` | 盘点完成 | `{ warehouseId, items:[{goodsId,actualQty}] }` | 按实盘数**覆盖**库存;返回 null |

> 注:`receive/ship/finish` 仅做库存联动;单据自身状态由前端紧随其后调用 `PUT /<order>/:id` 置为 已入库/已出库/已完成(后端也可在这些端点内一并改状态,前端兼容)。

## 后端实现要点

- 库存以「商品×仓库」为唯一键;`receive` 增、`ship` 减、`finish` 覆盖,并各记一条流水。
- `ship` 必须先整单校验再扣减,避免部分扣减。
- 列表 `keyword` 为跨字段模糊;分页 `total` 为过滤后总数。
- 权限:`permissions` 决定按钮;`menus` 决定可见页面与路由。
