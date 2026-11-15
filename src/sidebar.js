// Runs inside the upstream client factory; reuses its API, controller and UI.
const NS = "dsh-skill-explorer";
const inject = ["slots", "locale", "sidebarRightTabs"];
const TAB_ID = "dsh-skill-center-right";

function SkillCenterSidebar() {
  // Each native tab owns its editor; retained bodies keep drafts when hidden.
  const [controller] = react.useState(() => new PanelController());
  const [api] = react.useState(() => new SkillApi());
  return react_jsx_runtime.jsx("div", {
    className: panel_module_css_default.view,
    "data-dsh-skill-explorer-view": "",
    "data-dsh-plugin": "skill-center-right",
    children: react_jsx_runtime.jsx(SkillPanel, { controller, api })
  });
}

function SkillCenterIcon({ size = 20 }) {
  return react_jsx_runtime.jsxs("svg", {
    viewBox: "0 0 16 16", width: size, height: size, fill: "none",
    stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round",
    strokeLinejoin: "round", "aria-hidden": true,
    children: [
      react_jsx_runtime.jsx("path", { d: "M8 3.2C6.6 2 4.5 2 3 2v10.5c1.5 0 3.6 0 5 1.3 1.4-1.3 3.5-1.3 5-1.3V2c-1.5 0-3.6 0-5 1.2z" }),
      react_jsx_runtime.jsx("path", { d: "M8 3.2v10.6" })
    ]
  });
}

function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }));
  setRuntimeTranslate(ctx.locale.bind(NS));
  ctx.effect(() => {
    const disposeBody = ctx.slots.inject("sidebar.right.pane.tab", () =>
      ctx.slots.register({ name: "sidebar.right.pane.tab", key: TAB_ID }, SkillCenterSidebar)
    );
    let disposeType;
    try {
      disposeType = ctx.sidebarRightTabs.register({
        id: TAB_ID, kind: "skill-center", keepMounted: true,
        title: () => tt("entry.label"),
        guide: [{ id: "skills", order: 30, title: () => tt("entry.label"), icon: SkillCenterIcon }]
      });
    } catch (error) {
      disposeBody();
      throw error;
    }
    return () => { disposeType(); disposeBody(); };
  });
}
