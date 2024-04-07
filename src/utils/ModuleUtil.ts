export const addModule = (module) => {
    let uid = 0;
  
    return {
      createComponent: () => {
        uid++;
        const component = new module();
        component.$uid = uid;
  
        return component;
      },
    };
  };