# 两大模块完善实现计划(权限分配 / 单据流转 / 其余补全)

> 用 subagent-driven-development 逐批执行。复用已有内核:`useCrud` / `crudMock` / `resolvePage` / `v-permission`。

**Goal:** 把设计文档里 MVP 阶段砍掉的业务子功能补上,让两大模块从"骨架 CRUD"走向"业务可用"。

**优先级(用户确认):** ① 角色分配权限 → ② 采购/销售审核+出入库流转 → ③ 其余(重置密码/个人中心/部门树/入库出库单/出入库流水/盘点)。

---

## 批次 A:角色分配权限(优先级 ①)

让权限系统闭环:给角色勾选权限码。

- **Mock**:`mock/system.ts` 加 `GET /api/system/permission/all` → 返回按模块分组的权限树:
  `[{ module:'用户管理', perms:[{code:'user:add',title:'新增'},{code:'user:edit',title:'编辑'},{code:'user:delete',title:'删除'}] }, ...]`,覆盖现有 10 个可变资源。
- **角色 seed** 加 `permissions: string[]` 字段(admin 角色给全量,其余给部分)。
- **页面** `src/views/system/role.vue`:操作列加「分配权限」链接 → 打开 Drawer/Modal,内含 `a-tree` checkable(treeData 由 permission/all 构建,父节点=模块、叶子=权限码),回显该角色 `permissions`,保存时 `update(id, { permissions: checkedKeys })`。
- 权限码 `role:assign` 控制该按钮。

## 批次 B:采购/销售 状态流转(优先级 ②)

让"状态"从死字段变成有动作的流转。

- **采购** `purchase.vue`:操作列按状态加按钮 —— `待审核`→[审核](PUT status=已审核);`已审核`→[收货](PUT status=已入库)。均 Popconfirm。保留编辑/删除。
- **销售** `sale.vue`:`待审核`→[审核](→已审核);`已审核`→[发货](→已出库)。
- 权限码 `purchase:audit`/`sale:audit`(审核与收发货复用一个 audit 码即可,MVP 不细分)。
- 说明(ponytail 注释):收货/发货暂不联动库存数量——订单未做多行明细(无具体商品/数量),库存联动需明细表,留后续。

## 批次 C:系统管理其余补全(优先级 ③-1)

- **用户重置密码**:`user.vue` 操作列加「重置密码」(Popconfirm)→ mock `POST /api/system/user/:id/reset-password` 返回成功 → toast「密码已重置为 123456」。权限码 `user:reset`。
- **个人中心** `src/views/profile.vue`(路由 `/profile`,从顶栏用户下拉进入,不进侧栏菜单):展示当前用户信息(取 `useAuthStore().user`)+ 修改密码表单 → mock `POST /api/user/change-password`。`BasicLayout.vue` 用户下拉加「个人中心」项 `router.push('/profile')`。`/profile` 作为静态子路由加进 `router/index.ts` 的 layout children。
- **部门树形** `dept.vue`:dept seed 改为带 `parentId`(顶级 parentId=0),页面把扁平列表构建成 `children` 嵌套结构喂给 `a-table`(AntD 表格 row 带 `children` 即渲染树),`row-key="id"`。保留增删改。

## 批次 D:进销存其余补全(优先级 ③-2)

新增页面均沿用 CRUD 模板,资源在 `/scm/*`,seed 进 `mock/scm.ts`:

- **采购入库单** `inbound.vue` `/scm/inbound`:`{ id, inboundNo, sourceOrderNo, warehouseName, amount, date }`。
- **销售出库单** `outbound.vue` `/scm/outbound`:`{ id, outboundNo, sourceOrderNo, warehouseName, amount, date }`。
- **出入库流水** `flow.vue` `/scm/flow`(只读,同 stock 套路):`{ id, type, goodsName, warehouseName, quantity, date }`,type 为「入库/出库」用 tag。
- **库存盘点** `check.vue` `/scm/check`:`{ id, checkNo, warehouseName, status, date }`,status 用 select(进行中/已完成)。

## 批次 E:补菜单 + 权限码 + 端到端(controller)

- `mock/user.ts`:系统管理加不进菜单的功能(重置/个人中心走按钮,不加菜单);进销存菜单补 入库单/出库单/出入库流水/库存盘点 四项。
- `permissions` 补:`role:assign`、`user:reset`、`purchase:audit`、`sale:audit`,以及四个新资源的 `add/edit/delete`(流水只读无权限码)。
- 全套 `pnpm test` + `pnpm run build` 通过;dev 起服务逐个资源接口探活;里程碑提交。

---

## Self-Review
- 覆盖设计文档 5.1 剩余(重置密码/分配权限/个人中心/部门树)与 5.2 剩余(入库出库单/流水/盘点/单据审核)。
- 仍留后续(深水区,本次不做):订单多行明细子表、收发货真正联动库存数量、盘点差异调整逻辑、真实后端联调。这些标注为后续迭代。
