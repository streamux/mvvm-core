export class ModuleManager {
  static create() {
    return new ModuleManager();
  }

  constructor() {
    this.modulesMap = new Map();
  }

  get modules() {
    return this.modulesMap;
  }

  set modules(modules = {}) {
    Object.entries(modules).forEach(([key, module]) => {
      if (!module) return;

      this.modulesMap.set(key, addModule(module));
    });
  }
}
