export const addOnModule = (component: any) => {
  let uid = 0;

  return {
    createComponent: () => {
      uid++;
      const instance = new component();
      instance.$uid = uid;

      return instance;
    }
  };
};
