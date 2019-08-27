; ModuleID = 'syscall.c'
source_filename = "syscall.c"
target datalayout = "e-m:e-p:64:64-i64:64-i128:128-n64-S128"
target triple = "riscv64-unknown-unknown-elf"

; Function Attrs: noinline nounwind optnone
define dso_local i64 @syscall(i64 %n, i64 %_a0, i64 %_a1, i64 %_a2, i64 %_a3, i64 %_a4, i64 %_a5) #0 {
entry:
  %n.addr = alloca i64, align 8
  %_a0.addr = alloca i64, align 8
  %_a1.addr = alloca i64, align 8
  %_a2.addr = alloca i64, align 8
  %_a3.addr = alloca i64, align 8
  %_a4.addr = alloca i64, align 8
  %_a5.addr = alloca i64, align 8
  %a0 = alloca i64, align 8
  %a1 = alloca i64, align 8
  %a2 = alloca i64, align 8
  %a3 = alloca i64, align 8
  %a4 = alloca i64, align 8
  %a5 = alloca i64, align 8
  %syscall_id = alloca i64, align 8
  store i64 %n, i64* %n.addr, align 8
  store i64 %_a0, i64* %_a0.addr, align 8
  store i64 %_a1, i64* %_a1.addr, align 8
  store i64 %_a2, i64* %_a2.addr, align 8
  store i64 %_a3, i64* %_a3.addr, align 8
  store i64 %_a4, i64* %_a4.addr, align 8
  store i64 %_a5, i64* %_a5.addr, align 8
  %0 = load i64, i64* %_a0.addr, align 8
  store i64 %0, i64* %a0, align 8
  %1 = load i64, i64* %_a1.addr, align 8
  store i64 %1, i64* %a1, align 8
  %2 = load i64, i64* %_a2.addr, align 8
  store i64 %2, i64* %a2, align 8
  %3 = load i64, i64* %_a3.addr, align 8
  store i64 %3, i64* %a3, align 8
  %4 = load i64, i64* %_a4.addr, align 8
  store i64 %4, i64* %a4, align 8
  %5 = load i64, i64* %_a5.addr, align 8
  store i64 %5, i64* %a5, align 8
  %6 = load i64, i64* %n.addr, align 8
  store i64 %6, i64* %syscall_id, align 8
  %7 = load i64, i64* %a0, align 8
  %8 = load i64, i64* %a1, align 8
  %9 = load i64, i64* %a2, align 8
  %10 = load i64, i64* %a3, align 8
  %11 = load i64, i64* %a4, align 8
  %12 = load i64, i64* %a5, align 8
  %13 = load i64, i64* %syscall_id, align 8
  %14 = call i64 asm sideeffect "scall", "={x10},{x11},{x12},{x13},{x14},{x15},{x17},0"(i64 %8, i64 %9, i64 %10, i64 %11, i64 %12, i64 %13, i64 %7) #1, !srcloc !2
  store i64 %14, i64* %a0, align 8
  %15 = load i64, i64* %a0, align 8
  ret i64 %15
}

attributes #0 = { noinline nounwind optnone "correctly-rounded-divide-sqrt-fp-math"="false" "disable-tail-calls"="false" "frame-pointer"="all" "less-precise-fpmad"="false" "min-legal-vector-width"="0" "no-infs-fp-math"="false" "no-jump-tables"="false" "no-nans-fp-math"="false" "no-signed-zeros-fp-math"="false" "no-trapping-math"="false" "stack-protector-buffer-size"="8" "target-features"="+relax" "unsafe-fp-math"="false" "use-soft-float"="false" }
attributes #1 = { nounwind }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 1, !"wchar_size", i32 4}
!1 = !{!"clang version 10.0.0 (https://github.com/llvm/llvm-project.git 3d68adebc579720a3914d50e77a413773be34f16)"}
!2 = !{i32 375}
