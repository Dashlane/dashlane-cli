import meta from "../../../pages/_meta.ts";
import business_meta from "../../../pages/business/_meta.ts";
import integrations_meta from "../../../pages/integrations/_meta.ts";
import personal_meta from "../../../pages/personal/_meta.ts";
import personal_secrets_meta from "../../../pages/personal/secrets/_meta.ts";
export const pageMap = [{
  data: meta
}, {
  name: "business",
  route: "/business",
  children: [{
    data: business_meta
  }, {
    name: "audit-logs",
    route: "/business/audit-logs",
    frontMatter: {
      "sidebarTitle": "Audit Logs"
    }
  }, {
    name: "dwi",
    route: "/business/dwi",
    frontMatter: {
      "sidebarTitle": "Dwi"
    }
  }, {
    name: "index",
    route: "/business",
    frontMatter: {
      "sidebarTitle": "Index"
    }
  }, {
    name: "members",
    route: "/business/members",
    frontMatter: {
      "sidebarTitle": "Members"
    }
  }, {
    name: "reports",
    route: "/business/reports",
    frontMatter: {
      "sidebarTitle": "Reports"
    }
  }]
}, {
  name: "guides",
  route: "/guides",
  frontMatter: {
    "sidebarTitle": "Guides"
  }
}, {
  name: "index",
  route: "/",
  frontMatter: {
    "sidebarTitle": "Index"
  }
}, {
  name: "install",
  route: "/install",
  frontMatter: {
    "sidebarTitle": "Install"
  }
}, {
  name: "integrations",
  route: "/integrations",
  children: [{
    data: integrations_meta
  }, {
    name: "github-action",
    route: "/integrations/github-action",
    frontMatter: {
      "sidebarTitle": "GitHub Action"
    }
  }, {
    name: "mcp",
    route: "/integrations/mcp",
    frontMatter: {
      "sidebarTitle": "Mcp"
    }
  }, {
    name: "siem",
    route: "/integrations/siem",
    frontMatter: {
      "sidebarTitle": "Siem"
    }
  }, {
    name: "vscode",
    route: "/integrations/vscode",
    frontMatter: {
      "sidebarTitle": "Vscode"
    }
  }]
}, {
  name: "integrations",
  route: "/integrations",
  frontMatter: {
    "sidebarTitle": "Integrations"
  }
}, {
  name: "personal",
  route: "/personal",
  children: [{
    data: personal_meta
  }, {
    name: "authentication",
    route: "/personal/authentication",
    frontMatter: {
      "sidebarTitle": "Authentication"
    }
  }, {
    name: "backup",
    route: "/personal/backup",
    frontMatter: {
      "sidebarTitle": "Backup"
    }
  }, {
    name: "devices",
    route: "/personal/devices",
    frontMatter: {
      "sidebarTitle": "Devices"
    }
  }, {
    name: "logout",
    route: "/personal/logout",
    frontMatter: {
      "sidebarTitle": "Logout"
    }
  }, {
    name: "secrets",
    route: "/personal/secrets",
    children: [{
      data: personal_secrets_meta
    }, {
      name: "exec",
      route: "/personal/secrets/exec",
      frontMatter: {
        "sidebarTitle": "Exec"
      }
    }, {
      name: "inject",
      route: "/personal/secrets/inject",
      frontMatter: {
        "sidebarTitle": "Inject"
      }
    }, {
      name: "read",
      route: "/personal/secrets/read",
      frontMatter: {
        "sidebarTitle": "Read"
      }
    }]
  }, {
    name: "vault",
    route: "/personal/vault",
    frontMatter: {
      "sidebarTitle": "Vault"
    }
  }]
}, {
  name: "personal",
  route: "/personal",
  frontMatter: {
    "sidebarTitle": "Personal"
  }
}, {
  name: "security",
  route: "/security",
  frontMatter: {
    "sidebarTitle": "Security"
  }
}, {
  name: "troubleshooting",
  route: "/troubleshooting",
  frontMatter: {
    "sidebarTitle": "Troubleshooting"
  }
}];