# CMakeList.txt : CMake project for CLI, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.8)

project ("CLI")

# Add source to this project's executable.
add_executable (CLI "CLI.cpp" "CLI.h")

if (CMAKE_VERSION VERSION_GREATER 3.12)
  set_property(TARGET CLI PROPERTY CXX_STANDARD 20)
endif()

# TODO: Add tests and install targets if needed.
